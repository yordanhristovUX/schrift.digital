import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Helmet } from 'react-helmet-async';
import { supabase } from '../lib/supabase';
import { Font } from '../types/font';
import { getFeaturedFonts, loadFontFaces, getGroupedWeights, getWeightValue } from '../lib/fontService';

const Home: React.FC = () => {
  const [fonts, setFonts] = useState<Font[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [previewText, setPreviewText] = useState('Щурецът свири, а жабите скачат върху дъбови листа.');
  const [fontSizes, setFontSizes] = useState<Record<string, number>>({});
  const [selectedWeights, setSelectedWeights] = useState<Record<string, string>>({});
  const navigate = useNavigate();
  const { t, i18n } = useTranslation(['common']);
  
  useEffect(() => {
    const fetchFonts = async () => {
      try {
        // Debug environment variables
        console.log('Supabase URL:', import.meta.env.VITE_SUPABASE_URL);
        console.log('Supabase Anon Key exists:', !!import.meta.env.VITE_SUPABASE_ANON_KEY);
        
        // Check if environment variables are properly loaded
        if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) {
          throw new Error('Supabase configuration is missing. Please check your .env file and restart the development server.');
        }

        // Test basic connectivity first
        console.log('Testing Supabase connection...');
        
        // Test direct Supabase query first
        const { data: directData, error: directError } = await supabase
          .from('fonts')
          .select('*')
          .eq('featured', true)
          .limit(10);

        if (directError) {
          console.error('Direct Supabase query error:', directError);
          throw new Error(`Database query failed: ${directError.message}`);
        }

        console.log('Direct query result:', directData);
        
        // Then try through the service
        const data = await getFeaturedFonts();
        console.log('Service query result:', data);
        
        // Initialize font sizes and weights
        const sizes: Record<string, number> = {};
        const weights: Record<string, string> = {};
        data.forEach(font => {
          sizes[font.id] = 32;
          // Set default weight to Regular if available, otherwise first available weight
          const availableWeights = font.weight_files ? Object.values(font.weight_files).map(f => f.weight) : ['Regular'];
          weights[font.id] = availableWeights.includes('Regular') ? 'Regular' : availableWeights[0];
        });
        
        setFontSizes(sizes);
        setSelectedWeights(weights);
        setFonts(data);

        // Load fonts dynamically
        loadFontFaces(data);
      } catch (err: any) {
        console.error('Error fetching fonts:', err);
        
        // Provide more specific error messages
        let errorMessage = 'Failed to fetch fonts';
        
        if (err.message?.includes('Failed to fetch')) {
          errorMessage = 'Cannot connect to the database. Please check your internet connection and try again.';
        } else if (err.message?.includes('configuration is missing')) {
          errorMessage = err.message;
        } else if (err.message) {
          errorMessage = err.message;
        }
        
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };
    
    fetchFonts();
  }, []);

  useEffect(() => {
    // Update preview text based on language
    if (i18n.language === 'en') {
      setPreviewText('The quick brown fox jumps over the lazy dog.');
    } else {
      setPreviewText('Щурецът свири, а жабите скачат върху дъбови листа.');
    }
  }, [i18n.language]);

  const handleSizeChange = (fontId: string, size: number) => {
    setFontSizes(prev => ({ ...prev, [fontId]: size }));
  };

  const handleWeightChange = (fontId: string, weight: string) => {
    setSelectedWeights(prev => ({ ...prev, [fontId]: weight }));
  };

  const handleFontClick = async (fontId: string) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      navigate(`/fonts/${fontId}`);
    } else {
      navigate('/login', { state: { from: `/fonts/${fontId}` } });
    }
  };

  const handleRetry = () => {
    setError(null);
    setLoading(true);
    // Trigger re-fetch by updating a state that will cause useEffect to run
    window.location.reload();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-sm h-12 w-12 border-b-2 border-[#141204]"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="text-red-600 p-4 bg-red-50 rounded-sm mb-4">
            <h3 className="font-semibold mb-2">Connection Error</h3>
            <p>{error}</p>
          </div>
          <button
            onClick={handleRetry}
            className="px-4 py-2 bg-[#141204] text-white rounded-sm hover:bg-[#2D2B1F] transition-colors"
          >
            Try Again
          </button>
          <div className="mt-4 text-sm text-gray-600">
            <p>If the problem persists:</p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>Check your internet connection</li>
              <li>Restart the development server</li>
              <li>Verify Supabase configuration</li>
            </ul>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>{t('meta.title')}</title>
        <meta name="description" content={t('meta.description')} />
      </Helmet>

      <div className="min-h-screen">
        {/* Header */}
        <header className="section bg-background-inverse">
          <div className="container mx-auto max-w-6xl">
            <h1 className="text-5xl md:text-6xl text-text-inverse font-bold mb-4 font-['Listopad']">
              {t('home.title')}
            </h1>
            <h2 className="text-2xl text-text-tertiary mb-8 font-['Listopad']">
              {t('home.subtitle')}
            </h2>
          </div>
        </header>

        {/* Font Preview Section */}
        <section className="section bg-background-primary">
          <div className="container mx-auto max-w-5xl">
            {/* Library count */}
            <p className="text-lg text-[#5E6572] mb-8 font-['Listopad']">
              {t('home.library_count', { count: fonts.length })}
            </p>

            {/* Preview text input */}
            <div className="mb-12">
              <input
                type="text"
                value={previewText}
                onChange={(e) => setPreviewText(e.target.value)}
                className="w-full text-base p-6 bg-[#FFFFFC] text-text-primary border border-[#D9D9D9] hover:border-[#141204] focus:border-[#141204] focus:outline-none transition-colors duration-200 rounded-sm font-['Listopad']"
                placeholder={t('home.preview_placeholder')}
              />
            </div>

            {/* Font list */}
            <div className="space-y-12">
              {fonts.map(font => {
                const { normal, italic } = getGroupedWeights(font);
                const availableWeights = font.weight_files ? 
                  [...new Set(Object.values(font.weight_files).map(f => f.weight))]
                    .sort((a, b) => getWeightValue(a) - getWeightValue(b)) : 
                  ['Regular'];
                const currentWeight = selectedWeights[font.id] || 'Regular';
                const currentWeightValue = getWeightValue(currentWeight);
                
                return (
                  <div 
                    key={font.id} 
                    className="border border-border-primary rounded-sm p-6 bg-background-primary transition-all duration-300 hover:shadow-lg"
                  >
                    <div className="flex items-center justify-between mb-6">
                      <div>
                        <h3 className="text-xl font-semibold text-text-primary">{font.name}</h3>
                        <p className="text-sm text-text-secondary">
                          <span className="font-['Listopad']">{t('home.font_info.designer')}:</span> {font.designer}
                        </p>
                      </div>
                      <button
                        onClick={() => handleFontClick(font.id)}
                        className="text-sm text-[#141204] hover:text-[#2D2B1F] font-['Listopad']"
                      >
                        {t('home.download')}
                      </button>
                    </div>

                    <div 
                      className="mb-8 text-text-primary"
                      style={{ 
                        fontFamily: `"${font.name}", sans-serif`,
                        fontSize: `${fontSizes[font.id]}px`,
                        fontWeight: currentWeightValue,
                        lineHeight: '1.3'
                      }}
                    >
                      {previewText}
                    </div>

                    <div className="space-y-6 mb-8">
                      <div>
                        <div className="flex justify-between mb-2">
                          <label className="text-sm font-medium text-text-primary font-['Listopad']">
                            {t('home.font_size')}
                          </label>
                          <span className="text-sm text-text-secondary font-['Listopad']">{fontSizes[font.id]}px</span>
                        </div>
                        <input
                          type="range"
                          min="12"
                          max="72"
                          value={fontSizes[font.id]}
                          onChange={(e) => handleSizeChange(font.id, parseInt(e.target.value))}
                          className="w-full h-1 bg-background-secondary rounded-sm appearance-none cursor-pointer"
                        />
                      </div>

                      <div>
                        <div className="flex justify-between mb-2">
                          <label className="text-sm font-medium text-text-primary font-['Listopad']">
                            {t('home.font_weight')}
                          </label>
                          <span className="text-sm text-text-secondary font-['Listopad']">{currentWeight}</span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {availableWeights.map((weight) => (
                            <button
                              key={weight}
                              onClick={() => handleWeightChange(font.id, weight)}
                              className={`px-3 py-1 text-sm rounded-sm font-['Listopad'] transition-colors ${
                                currentWeight === weight
                                  ? 'bg-[#141204] text-[#FFFFFC]'
                                  : 'bg-[#D9D9D9] text-[#141204] hover:bg-[#BCBDC0]'
                              }`}
                            >
                              {weight}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      {/* Normal weights */}
                      {normal.length > 0 && (
                        <div className="flex flex-wrap gap-8">
                          {normal.map(([key, file]) => (
                            <div
                              key={key}
                              className="text-center"
                            >
                              <div
                                className="text-4xl text-text-primary mb-2"
                                style={{ 
                                  fontFamily: `"${font.name}", sans-serif`,
                                  fontWeight: getWeightValue(file.weight),
                                  fontStyle: 'normal'
                                }}
                              >
                                Aa
                              </div>
                              <div className="text-sm text-text-secondary font-['Listopad']">{file.weight}</div>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Italic weights */}
                      {italic.length > 0 && (
                        <div className="flex flex-wrap gap-8 pt-4 border-t border-border-primary">
                          {italic.map(([key, file]) => (
                            <div
                              key={key}
                              className="text-center"
                            >
                              <div
                                className="text-4xl text-text-primary mb-2"
                                style={{ 
                                  fontFamily: `"${font.name}", sans-serif`,
                                  fontWeight: getWeightValue(file.weight),
                                  fontStyle: 'italic'
                                }}
                              >
                                Aa
                              </div>
                              <div className="text-sm text-text-secondary font-['Listopad']">{file.weight} Italic</div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      </div>
    </>
  );
};

export default Home;
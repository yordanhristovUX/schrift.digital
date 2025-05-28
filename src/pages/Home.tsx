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
  const [previewText, setPreviewText] = useState('Щурецът свири, а жабите скачат върху дъбови листа.');
  const [fontSizes, setFontSizes] = useState<Record<string, number>>({});
  const [fontWeights, setFontWeights] = useState<Record<string, number>>({});
  const navigate = useNavigate();
  const { t, i18n } = useTranslation(['common']);
  
  useEffect(() => {
    const fetchFonts = async () => {
      try {
        const data = await getFeaturedFonts();
        
        // Initialize font sizes and weights
        const sizes: Record<string, number> = {};
        const weights: Record<string, number> = {};
        data.forEach(font => {
          sizes[font.id] = 32;
          weights[font.id] = 400;
        });
        
        setFontSizes(sizes);
        setFontWeights(weights);
        setFonts(data);

        // Load fonts dynamically
        loadFontFaces(data);
      } catch (err) {
        console.error('Error fetching fonts:', err);
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

  const handleWeightChange = (fontId: string, weight: number) => {
    setFontWeights(prev => ({ ...prev, [fontId]: weight }));
  };

  const handleFontClick = async (fontId: string) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      navigate(`/fonts/${fontId}`);
    } else {
      navigate('/login', { state: { from: `/fonts/${fontId}` } });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-sm h-12 w-12 border-b-2 border-[#141204]"></div>
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
        <header className="pt-32 pb-16 px-4 bg-background-inverse">
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
        <section className="py-16 px-4 bg-background-primary">
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
                        fontFamily: font.name,
                        fontSize: `${fontSizes[font.id]}px`,
                        fontWeight: fontWeights[font.id],
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
                          <span className="text-sm text-text-secondary font-['Listopad']">{fontWeights[font.id]}</span>
                        </div>
                        <input
                          type="range"
                          min="100"
                          max="900"
                          step="100"
                          value={fontWeights[font.id]}
                          onChange={(e) => handleWeightChange(font.id, parseInt(e.target.value))}
                          className="w-full h-1 bg-background-secondary rounded-sm appearance-none cursor-pointer"
                        />
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
                                  fontFamily: font.name,
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
                                  fontFamily: font.name,
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
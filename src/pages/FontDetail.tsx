import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ChevronLeft, Download, Crown } from 'lucide-react';
import FontPreview from '../components/FontPreview';
import { Font } from '../types/font';
import { getFontById, downloadFont } from '../lib/fontService';
import { supabase } from '../lib/supabase';

const FontDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [font, setFont] = useState<Font | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasSubscription, setHasSubscription] = useState(false);
  
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate('/login', { state: { from: `/fonts/${id}` } });
        return;
      }

      // Check subscription status
      const { data: subscriptionData } = await supabase.rpc('has_active_premium');
      setHasSubscription(!!subscriptionData);

      const fetchFont = async () => {
        try {
          if (!id) throw new Error('Font ID is required');
          const data = await getFontById(id);
          if (!data) throw new Error('Font not found');
          setFont(data);
          
          // Check if font requires subscription and user doesn't have one
          if (data.subscriber_only && !subscriptionData) {
            // Allow viewing the font page but restrict download
            console.log('User viewing subscriber-only font without subscription');
          }
          
        } catch (err: any) {
          console.error('Error fetching font:', err);
          setError(err.message);
        } finally {
          setLoading(false);
        }
      };

      fetchFont();
    };

    checkAuth();
  }, [id, navigate]);

  const handleDownload = async () => {
    if (font?.subscriber_only && !hasSubscription) {
      navigate('/supporter');
      return;
    }
    
    if (font) {
      downloadFont(font);
    }
  };

  const handleBack = () => {
    navigate('/');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-sm h-12 w-12 border-b-2 border-[#141204]"></div>
      </div>
    );
  }

  if (error || !font) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-[#141204]">
          {error || 'Font not found'}
        </div>
      </div>
    );
  }

  return (
    <>
      <section className="section-sm">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <button 
            onClick={handleBack}
            className="inline-flex items-center text-[#141204] hover:text-[#2D2B1F] mb-8"
          >
            <ChevronLeft size={16} className="mr-1" />
            Back to all fonts
          </button>
          
          {font.subscriber_only && (
            <div className="flex justify-start mb-4">
              <span className="inline-flex items-center px-2 py-1 text-xs font-medium text-red-700 bg-red-100 rounded-full">
                <Crown size={12} className="mr-1" />
                Subscriber Only
              </span>
            </div>
          )}
          
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-[#141204] mb-2">{font.name}</h1>
              <p className="text-[#5E6572]">{font.designer} • {Object.keys(font.weight_files || {}).length} weights</p>
            </div>
            
            <div className="mt-4 md:mt-0">
              <button 
                onClick={handleDownload}
                className="flex items-center px-4 py-2 rounded-sm text-sm font-medium bg-[#141204] text-[#FFFFFC] hover:bg-[#2D2B1F]"
              >
                {font.subscriber_only && !hasSubscription && (
                  <Crown size={16} className="mr-2" />
                )}
                <Download size={16} className="mr-2" />
                {font.is_paid 
                  ? `Purchase Family $${font.price}` 
                  : font.subscriber_only && !hasSubscription
                    ? 'Become Subscriber to Download'
                    : `Download Complete Family (${Object.keys(font.weight_files || {}).length} weights)`}
              </button>
            </div>
          </div>
        </div>
      </section>
      
      <section className="section">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <FontPreview font={font} requireAuth={!font.subscriber_only || hasSubscription} />
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="md:col-span-2">
              <div className="bg-[#FFFFFC] rounded-sm shadow-md p-6 mb-6 border border-[#D9D9D9]">
                <h2 className="text-xl font-bold mb-4">About this font</h2>
                <div 
                  className="text-[#5E6572] mb-4 prose prose-sm max-w-none"
                  dangerouslySetInnerHTML={{ __html: font.description || '' }}
                />
              </div>
              
              <div className="bg-[#FFFFFC] rounded-sm shadow-md p-6 border border-[#D9D9D9]">
                <h2 className="text-xl font-bold mb-4">Features</h2>
                <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {font.opentype_features?.map((feature, index) => (
                    <li key={index} className="flex items-start">
                      <div className="flex-shrink-0 h-5 w-5 text-[#141204]">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <span className="ml-2 text-[#5E6572]">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            
            <div>
              <div className="bg-[#FFFFFC] rounded-sm shadow-md p-6 mb-6 border border-[#D9D9D9]">
                <h2 className="text-xl font-bold mb-4">Font Information</h2>
                <dl className="space-y-3">
                  <div>
                    <dt className="text-sm font-medium text-[#5E6572]">Designer</dt>
                    <dd className="text-[#141204]">{font.designer}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-[#5E6572]">Category</dt>
                    <dd className="text-[#141204]">{font.category}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-[#5E6572]">Language Support</dt>
                    <dd className="text-[#141204]">{font.language_support?.join(', ')}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-[#5E6572]">OpenType Features</dt>
                    <dd className="text-[#141204]">{font.opentype_features?.join(', ')}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-[#5E6572]">File Format</dt>
                    <dd className="text-[#141204]">OTF, TTF, WOFF, WOFF2</dd>
                  </div>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
};

export default FontDetail;
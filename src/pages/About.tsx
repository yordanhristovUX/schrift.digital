import React from 'react';
import { Mail, Download, Settings } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Helmet } from 'react-helmet-async';

// Custom Type Settings Icon (similar to Figma's icon)
const TypeSettingsIcon: React.FC<{ size?: number; className?: string }> = ({ size = 16, className = "" }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round"
    className={className}
  >
    <path d="M4 7V4h16v3" />
    <path d="M9 20h6" />
    <path d="M12 4v16" />
    <circle cx="12" cy="9" r="2" />
    <circle cx="12" cy="15" r="2" />
  </svg>
);

const About: React.FC = () => {
  const { t, i18n } = useTranslation(['common']);

  return (
    <>
      <Helmet>
        <title>{t('about.title')} | Schrift.Digital</title>
        <meta name="description" content={t('about.subtitle')} />
      </Helmet>

      {/* Hero section */}
      <section className="pt-24 pb-12 bg-[#141204]">
        <div className="container max-w-6xl">
          <h1 className="text-5xl md:text-6xl text-[#FFFFFC] font-bold mb-4 font-['Listopad'] text-left">
            {t('about.title')}
          </h1>
          <p className="text-[#BCBDC0] text-lg mb-8 font-['Listopad'] text-left">
            {t('about.subtitle')}
          </p>
        </div>
      </section>

      {/* Main content */}
      <section className="pt-16 pb-16 bg-[#FFFFFC]">
        <div className="container max-w-4xl">
          <div className="prose prose-lg max-w-none space-y-8 text-[#141204] font-['Listopad']">
            <p className="text-lg leading-relaxed text-left">
              {t('about.content.intro')}
            </p>

            <p className="text-lg leading-relaxed text-left">
              {t('about.content.problem')}
            </p>

            <p className="text-lg leading-relaxed text-left">
              {t('about.content.consequence')}
            </p>

            <div className="card my-12">
              <div className="card-header">
                <h2 className="card-title text-left">
                  {t('about.mission.title')}
                </h2>
              </div>
              <div className="card-content">
                <p className="text-lg leading-relaxed mb-0 text-[#141204] text-left">
                  {t('about.mission.description')}
                </p>
              </div>
            </div>

            <p className="text-lg leading-relaxed text-left">
              {t('about.content.belief')}
            </p>

            <p className="text-lg leading-relaxed text-left">
              {t('about.content.call_to_action')}
            </p>
          </div>

          {/* Font Usage Instructions */}
          <div className="card mb-12 mt-16">
            <div className="card-header">
              <h2 className="card-title text-left">
                {i18n.language === 'bg' ? 'Как да използвате шрифтовете' : 'How to Use the Fonts'}
              </h2>
            </div>
            <div className="card-content">
              {/* Show instructions based on current language */}
              {i18n.language === 'bg' ? (
                // Bulgarian Instructions
                <div className="space-y-6">
                  <div className="space-y-4">
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0 w-8 h-8 bg-[#141204] text-[#FFFFFC] rounded-full flex items-center justify-center text-sm font-bold">
                        1
                      </div>
                      <div className="text-left">
                        <h4 className="font-semibold text-[#141204] font-['Listopad']">Инсталирай шрифта</h4>
                        <p className="text-[#5E6572] font-['Listopad']">Изтегли и инсталирай .otf файла на компютъра си</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0 w-8 h-8 bg-[#141204] text-[#FFFFFC] rounded-full flex items-center justify-center text-sm font-bold">
                        2
                      </div>
                      <div className="text-left">
                        <h4 className="font-semibold text-[#141204] font-['Listopad']">Рестартирай Figma</h4>
                        <p className="text-[#5E6572] font-['Listopad']">Затвори и отвори отново Figma за да се зареди шрифтът</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0 w-8 h-8 bg-[#141204] text-[#FFFFFC] rounded-full flex items-center justify-center text-sm font-bold">
                        3
                      </div>
                      <div className="text-left">
                        <h4 className="font-semibold text-[#141204] font-['Listopad']">Намери Type Settings</h4>
                        <p className="text-[#5E6572] font-['Listopad']">Кликни на Type Settings иконата във Figma</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0 w-8 h-8 bg-[#C40000] text-[#FFFFFC] rounded-full flex items-center justify-center text-sm font-bold">
                        4
                      </div>
                      <div className="text-left">
                        <h4 className="font-semibold text-[#141204] font-['Listopad']">Активирай BG Cyrillic</h4>
                        <p className="text-[#5E6572] font-['Listopad']">
                          Избери таб <strong>Details</strong>, търси и активирай 
                          <span className="bg-[#F0F0F0] px-2 py-1 rounded text-sm font-mono ml-1">
                            Stylistic set: BG Cyrillic by N
                          </span>
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                // English Instructions
                <div className="space-y-6">
                  <div className="space-y-4">
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0 w-8 h-8 bg-[#141204] text-[#FFFFFC] rounded-full flex items-center justify-center text-sm font-bold">
                        1
                      </div>
                      <div className="text-left">
                        <h4 className="font-semibold text-[#141204] font-['Listopad']">Install the Font</h4>
                        <p className="text-[#5E6572] font-['Listopad']">Download and install the .otf file on your computer</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0 w-8 h-8 bg-[#141204] text-[#FFFFFC] rounded-full flex items-center justify-center text-sm font-bold">
                        2
                      </div>
                      <div className="text-left">
                        <h4 className="font-semibold text-[#141204] font-['Listopad']">Restart Figma</h4>
                        <p className="text-[#5E6572] font-['Listopad']">Close and reopen Figma to load the new font</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0 w-8 h-8 bg-[#141204] text-[#FFFFFC] rounded-full flex items-center justify-center text-sm font-bold">
                        3
                      </div>
                      <div className="text-left">
                        <h4 className="font-semibold text-[#141204] font-['Listopad']">Find Type Settings</h4>
                        <p className="text-[#5E6572] font-['Listopad']">Click on the Type Settings icon in Figma</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0 w-8 h-8 bg-[#C40000] text-[#FFFFFC] rounded-full flex items-center justify-center text-sm font-bold">
                        4
                      </div>
                      <div className="text-left">
                        <h4 className="font-semibold text-[#141204] font-['Listopad']">Activate BG Cyrillic</h4>
                        <p className="text-[#5E6572] font-['Listopad']">
                          Select the <strong>Details</strong> tab, search and activate 
                          <span className="bg-[#F0F0F0] px-2 py-1 rounded text-sm font-mono ml-1">
                            Stylistic set: BG Cyrillic by N
                          </span>
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Visual Tip */}
              <div className="mt-8 p-4 bg-[#F0F8FF] border border-[#B0D4F1] rounded-sm">
                <div className="text-left">
                  <h4 className="font-semibold text-[#1E40AF] font-['Listopad'] mb-1">
                    {i18n.language === 'bg' ? 'Полезен съвет' : 'Pro Tip'}
                  </h4>
                  <p className="text-[#1E40AF] font-['Listopad'] text-sm">
                    {i18n.language === 'bg' 
                      ? 'Активирането на "BG Cyrillic by N" е ключово за правилното показване на българските букви като "б", "в", "д", "ж", "з", "к", "р", "у", "ф", "ю" и други.'
                      : 'Activating "BG Cyrillic by N" is essential for proper display of Bulgarian letters like "б", "в", "д", "ж", "з", "к", "р", "у", "ф", "ю" and others.'
                    }
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Call to action */}
          <div className="text-left">
            <a 
              href="mailto:contact@schrift.digital" 
              className="btn btn-danger btn-lg"
            >
              <Mail size={20} className="mr-2" />
              {t('about.contact_us')}
            </a>
          </div>
        </div>
      </section>
    </>
  );
};

export default About;
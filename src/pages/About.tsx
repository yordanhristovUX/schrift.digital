import React from 'react';
import { Mail, Download, Settings, Search, Palette } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Helmet } from 'react-helmet-async';

const About: React.FC = () => {
  const { t, i18n } = useTranslation(['common']);

  return (
    <>
      <Helmet>
        <title>{t('about.title')} | Schrift.Digital</title>
        <meta name="description" content={t('about.subtitle')} />
      </Helmet>

      {/* Hero section */}
      <section className="section bg-[#141204]">
        <div className="container max-w-6xl">
          <h1 className="text-5xl md:text-6xl text-[#FFFFFC] font-bold mb-4 font-['Listopad']">
            {t('about.title')}
          </h1>
          <p className="text-[#BCBDC0] text-lg mb-8 font-['Listopad']">
            {t('about.subtitle')}
          </p>
        </div>
      </section>

      {/* Main content */}
      <section className="section bg-[#FFFFFC]">
        <div className="container max-w-4xl">
          <div className="prose prose-lg max-w-none space-y-8 text-[#141204] font-['Listopad']">
            <p className="text-lg leading-relaxed">
              {t('about.content.intro')}
            </p>

            <p className="text-lg leading-relaxed">
              {t('about.content.problem')}
            </p>

            <p className="text-lg leading-relaxed">
              {t('about.content.consequence')}
            </p>

            <div className="card my-12">
              <div className="card-header">
                <h2 className="card-title">
                  {t('about.mission.title')}
                </h2>
              </div>
              <div className="card-content">
                <p className="text-lg leading-relaxed mb-0 text-[#141204]">
                  {t('about.mission.description')}
                </p>
              </div>
            </div>

            <p className="text-lg leading-relaxed">
              {t('about.content.belief')}
            </p>

            <p className="text-lg leading-relaxed">
              {t('about.content.call_to_action')}
            </p>
          </div>

          {/* Call to action */}
          <div className="mt-16 text-center">
            {/* Font Usage Instructions */}
            <div className="card mb-12">
              <div className="card-header">
                <h2 className="card-title flex items-center justify-center">
                  <Download size={24} className="mr-3 text-[#C40000]" />
                  {i18n.language === 'bg' ? 'Как да използвате шрифтовете' : 'How to Use the Fonts'}
                </h2>
              </div>
              <div className="card-content">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Bulgarian Instructions */}
                  <div className="space-y-6">
                    <h3 className="text-lg font-semibold text-[#141204] font-['Listopad'] mb-4">
                      🇧🇬 Български
                    </h3>
                    <div className="space-y-4">
                      <div className="flex items-start space-x-3">
                        <div className="flex-shrink-0 w-8 h-8 bg-[#141204] text-[#FFFFFC] rounded-full flex items-center justify-center text-sm font-bold">
                          1
                        </div>
                        <div>
                          <h4 className="font-semibold text-[#141204] font-['Listopad']">Инсталирай шрифта</h4>
                          <p className="text-[#5E6572] font-['Listopad']">Изтегли и инсталирай .otf файла на компютъра си</p>
                        </div>
                      </div>
                      
                      <div className="flex items-start space-x-3">
                        <div className="flex-shrink-0 w-8 h-8 bg-[#141204] text-[#FFFFFC] rounded-full flex items-center justify-center text-sm font-bold">
                          2
                        </div>
                        <div>
                          <h4 className="font-semibold text-[#141204] font-['Listopad']">Рестартирай Figma</h4>
                          <p className="text-[#5E6572] font-['Listopad']">Затвори и отвори отново Figma за да се зареди шрифтът</p>
                        </div>
                      </div>
                      
                      <div className="flex items-start space-x-3">
                        <div className="flex-shrink-0 w-8 h-8 bg-[#141204] text-[#FFFFFC] rounded-full flex items-center justify-center text-sm font-bold">
                          3
                        </div>
                        <div>
                          <h4 className="font-semibold text-[#141204] font-['Listopad'] flex items-center">
                            <Settings size={16} className="mr-2" />
                            Намери Type Settings
                          </h4>
                          <p className="text-[#5E6572] font-['Listopad']">Кликни на Type Settings иконата във Figma</p>
                        </div>
                      </div>
                      
                      <div className="flex items-start space-x-3">
                        <div className="flex-shrink-0 w-8 h-8 bg-[#C40000] text-[#FFFFFC] rounded-full flex items-center justify-center text-sm font-bold">
                          4
                        </div>
                        <div>
                          <h4 className="font-semibold text-[#141204] font-['Listopad'] flex items-center">
                            <Search size={16} className="mr-2" />
                            Активирай BG Cyrillic
                          </h4>
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

                  {/* English Instructions */}
                  <div className="space-y-6">
                    <h3 className="text-lg font-semibold text-[#141204] font-['Listopad'] mb-4">
                      🇺🇸 English
                    </h3>
                    <div className="space-y-4">
                      <div className="flex items-start space-x-3">
                        <div className="flex-shrink-0 w-8 h-8 bg-[#141204] text-[#FFFFFC] rounded-full flex items-center justify-center text-sm font-bold">
                          1
                        </div>
                        <div>
                          <h4 className="font-semibold text-[#141204] font-['Listopad']">Install the Font</h4>
                          <p className="text-[#5E6572] font-['Listopad']">Download and install the .otf file on your computer</p>
                        </div>
                      </div>
                      
                      <div className="flex items-start space-x-3">
                        <div className="flex-shrink-0 w-8 h-8 bg-[#141204] text-[#FFFFFC] rounded-full flex items-center justify-center text-sm font-bold">
                          2
                        </div>
                        <div>
                          <h4 className="font-semibold text-[#141204] font-['Listopad']">Restart Figma</h4>
                          <p className="text-[#5E6572] font-['Listopad']">Close and reopen Figma to load the new font</p>
                        </div>
                      </div>
                      
                      <div className="flex items-start space-x-3">
                        <div className="flex-shrink-0 w-8 h-8 bg-[#141204] text-[#FFFFFC] rounded-full flex items-center justify-center text-sm font-bold">
                          3
                        </div>
                        <div>
                          <h4 className="font-semibold text-[#141204] font-['Listopad'] flex items-center">
                            <Settings size={16} className="mr-2" />
                            Find Type Settings
                          </h4>
                          <p className="text-[#5E6572] font-['Listopad']">Click on the Type Settings icon in Figma</p>
                        </div>
                      </div>
                      
                      <div className="flex items-start space-x-3">
                        <div className="flex-shrink-0 w-8 h-8 bg-[#C40000] text-[#FFFFFC] rounded-full flex items-center justify-center text-sm font-bold">
                          4
                        </div>
                        <div>
                          <h4 className="font-semibold text-[#141204] font-['Listopad'] flex items-center">
                            <Search size={16} className="mr-2" />
                            Activate BG Cyrillic
                          </h4>
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
                </div>
                
                {/* Visual Tip */}
                <div className="mt-8 p-4 bg-[#F0F8FF] border border-[#B0D4F1] rounded-sm">
                  <div className="flex items-start space-x-3">
                    <Palette size={20} className="text-[#2563EB] flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-[#1E40AF] font-['Listopad'] mb-1">
                        {i18n.language === 'bg' ? '💡 Полезен съвет' : '💡 Pro Tip'}
                      </h4>
                      <p className="text-[#1E40AF] font-['Listopad'] text-sm">
                        {i18n.language === 'bg' 
                          ? 'Активирането на "BG Cyrillic by N" е ключово за правилното показване на българските букви като "я", "ъ", "щ" и други.'
                          : 'Activating "BG Cyrillic by N" is essential for proper display of Bulgarian letters like "я", "ъ", "щ" and others.'
                        }
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

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
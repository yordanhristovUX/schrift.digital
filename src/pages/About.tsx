import React from 'react';
import { Mail } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Helmet } from 'react-helmet-async';

const About: React.FC = () => {
  const { t } = useTranslation(['common']);

  return (
    <>
      <Helmet>
        <title>{t('about.meta.title')}</title>
        <meta name="description" content={t('about.meta.description')} />
      </Helmet>

      {/* Hero section */}
      <section className="pt-32 pb-16 px-4 bg-[#141204]">
        <div className="container mx-auto max-w-6xl">
          <h1 className="text-5xl md:text-6xl text-[#FFFFFC] font-bold mb-4 font-['Listopad']">
            {t('about.title')}
          </h1>
          <p className="text-[#BCBDC0] text-lg mb-8 font-['Listopad']">
            {t('about.subtitle')}
          </p>
        </div>
      </section>

      {/* Main content */}
      <section className="py-16 bg-[#FFFFFC]">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl">
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

            <div className="bg-[#FFFFFC] rounded-sm shadow-md p-8 my-12 border border-[#D9D9D9]">
              <h2 className="text-2xl font-bold mb-4 font-['Listopad'] text-[#141204]">
                {t('about.mission.title')}
              </h2>
              <p className="text-lg leading-relaxed mb-0 text-[#141204]">
                {t('about.mission.description')}
              </p>
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
            <a 
              href="mailto:contact@schrift.digital" 
              className="inline-flex items-center px-6 py-3 bg-[#C40000] text-[#FFFFFC] rounded-sm hover:bg-[#A30000] transition-colors font-['Listopad']"
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
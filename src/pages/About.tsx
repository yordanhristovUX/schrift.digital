import React from 'react';
import { Mail } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Helmet } from 'react-helmet-async';

const About: React.FC = () => {
  const { t } = useTranslation(['common']);

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
import React from 'react';
import { Mail } from 'lucide-react';

const About: React.FC = () => {
  return (
    <>
      {/* Hero section */}
      <section className="pt-32 pb-16 px-4 bg-[#141204]">
        <div className="container mx-auto max-w-6xl">
          <h2 className="text-5xl md:text-6xl text-[#FFFFFC] font-bold mb-4 font-['Listopad']">
            Защо създадохме този проект
          </h2>
          <p className="text-[#BCBDC0] text-lg mb-8 font-['Listopad']">
            Връщаме българската кирилица в съвременния дизайн
          </p>
        </div>
      </section>

      {/* Main content */}
      <section className="py-16 bg-[#FFFFFC]">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl">
          <div className="prose prose-lg max-w-none space-y-8 text-[#141204]">
            <p className="text-lg leading-relaxed">
              В света на дизайна детайлите имат значение. За българските дизайнери използването на автентична българска кирилица не е просто естетически избор — това е въпрос на идентичност, четимост и уважение към езика ни.
            </p>

            <p className="text-lg leading-relaxed">
              Въпреки че много шрифтове поддържат български варианти на кирилицата, Figma не позволява автоматичното им активиране чрез езикови настройки. Това затруднява използването на българска кирилица в дизайни, особено при шрифтове, които предлагат специфични форми за българския език.
            </p>

            <p className="text-lg leading-relaxed">
              В резултат на това дизайнерите често са принудени да използват руски варианти на кирилицата, които не отразяват характерните особености на българската писменост. Това не само нарушава визуалната цялост на дизайна, но и подкопава културната ни идентичност.
            </p>

            <div className="bg-[#FFFFFC] rounded-sm shadow-md p-8 my-12 border border-[#D9D9D9]">
              <h3 className="text-2xl font-bold mb-4 font-['Listopad'] text-[#141204]">Нашата мисия</h3>
              <p className="text-lg leading-relaxed mb-0 text-[#141204]">
                Нашият проект има за цел да преодолее това ограничение, като предостави адаптирани версии на популярни шрифтове с активирани български варианти за всяка дебелина на шрифта. Това позволява на дизайнерите да използват българската кирилица в Figma без допълнителни настройки или компромиси с качеството на дизайна.
              </p>
            </div>

            <p className="text-lg leading-relaxed">
              Вярваме, че всеки дизайнер, работещ с български текст, заслужава достъп до инструменти, които отразяват езика и културата ни по най-добрия начин. С този проект се стремим да направим българската кирилица достъпна, видима и естествена част от дигиталния дизайн.
            </p>

            <p className="text-lg leading-relaxed">
              Присъединете се към нас в усилията да върнем българската кирилица там, където ѝ е мястото — в сърцето на съвременния дизайн.
            </p>
          </div>

          {/* Call to action */}
          <div className="mt-16 text-center">
            <a 
              href="mailto:contact@cyrillictype.com" 
              className="inline-flex items-center px-6 py-3 bg-[#C40000] text-[#FFFFFC] rounded-sm hover:bg-[#A30000] transition-colors font-['Listopad']"
            >
              <Mail size={20} className="mr-2" />
              Свържете се с нас
            </a>
          </div>
        </div>
      </section>
    </>
  );
};

export default About;
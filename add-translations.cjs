/**
 * add-translations.cjs
 * Adds ESV and MBB (Magandang Balita Biblia - Tagalog) translations to verses.json.
 * The existing NIV text is preserved inside a `translations` object.
 * Run: node add-translations.cjs
 */
const fs = require('fs');
const path = require('path');

// ---------------------------------------------------------------------------
// ESV and MBB text for each verse reference
// ---------------------------------------------------------------------------
const TRANSLATIONS = {
  // ESV: English Standard Version
  // MBB: Magandang Balita Biblia (Tagalog)

  "John 3:16": {
    ESV: "For God so loved the world, that he gave his only Son, that whoever believes in him should not perish but have eternal life.",
    MBB: "Sapagkat gayon na lamang ang pagmamahal ng Diyos sa mundo, kaya ibinigay niya ang kanyang kaisa-isang Anak, upang ang sinumang sumampalataya sa kanya ay hindi mapahamak, kundi magkaroon ng buhay na walang hanggan."
  },
  "Philippians 4:7": {
    ESV: "And the peace of God, which surpasses all understanding, will guard your hearts and your minds in Christ Jesus.",
    MBB: "At ang kapayapaan ng Diyos na higit sa lahat ng pag-unawa ay mag-iingat sa inyong mga puso at isipan sa pamamagitan ni Cristo Jesus."
  },
  "Hebrews 11:1": {
    ESV: "Now faith is the assurance of things hoped for, the conviction of things not seen.",
    MBB: "Ang pananampalataya ay pagtitiyak sa mga bagay na inaasahan, katibayan ng mga bagay na hindi nakikita."
  },
  "Psalm 100:4": {
    ESV: "Enter his gates with thanksgiving, and his courts with praise! Give thanks to him; bless his name!",
    MBB: "Pumasok kayo sa kanyang mga pintuan na may pagpapasalamat, at sa kanyang mga looban na may papuri. Magpasalamat kayo sa kanya at purihin ang kanyang pangalan."
  },
  "Romans 15:13": {
    ESV: "May the God of hope fill you with all joy and peace in believing, so that by the power of the Holy Spirit you may abound in hope.",
    MBB: "Nawa ang Diyos ng pag-asa ay punuin kayo ng buong kagalakan at kapayapaan sa inyong paniniwala, upang kayo ay mag-umapaw sa pag-asa sa pamamagitan ng kapangyarihan ng Espiritu Santo."
  },
  "Isaiah 26:3": {
    ESV: "You keep him in perfect peace whose mind is stayed on you, because he trusts in you.",
    MBB: "Ang taong nanalig sa iyo, na ang isip ay nakatutok sa iyo, ay iyong bibigyan ng ganap na kapayapaan."
  },
  "Matthew 17:20": {
    ESV: "He said to them, 'Because of your little faith. For truly, I say to you, if you have faith like a grain of mustard seed, you will say to this mountain, \"Move from here to there,\" and it will move, and nothing will be impossible for you.'",
    MBB: "Sinabi niya sa kanila, 'Dahil sa inyong kakulangan ng pananalig. Sinasabi ko sa inyo, kung mayroon kayong pananampalatayang kasing-liit ng butil ng mustasa, maaari ninyong sabihin sa bundok na ito, \"Lumipat ka mula rito patungo roon,\" at lilipat ito. Wala ni isang bagay ang magiging imposible para sa inyo.'"
  },
  "1 Thessalonians 5:18": {
    ESV: "Give thanks in all circumstances; for this is the will of God in Christ Jesus for you.",
    MBB: "Magpasalamat kayo sa lahat ng pagkakataon, sapagkat ito ang kalooban ng Diyos para sa inyo kay Cristo Jesus."
  },
  "Jeremiah 29:11": {
    ESV: "For I know the plans I have for you, declares the LORD, plans for welfare and not for evil, to give you a future and a hope.",
    MBB: "Sapagkat alam ko ang mga plano ko para sa inyo, sabi ng Panginoon, mga planong magbibigay sa inyo ng kapakanan at hindi ng kasamaan, upang bigyan kayo ng kinabukasan at pag-asa."
  },
  "John 14:27": {
    ESV: "Peace I leave with you; my peace I give to you. Not as the world gives do I give to you. Let not your hearts be troubled, neither let them be afraid.",
    MBB: "Kapayapaan ang iniiwan ko sa inyo; ang aking kapayapaan ang ibinibigay ko sa inyo. Hindi ko ibinibigay sa inyo ang kapayapaan na ibinibigay ng mundo. Huwag pabalisa ang inyong mga puso at huwag matakot."
  },
  "Proverbs 3:5-6": {
    ESV: "Trust in the LORD with all your heart, and do not lean on your own understanding. In all your ways acknowledge him, and he will make straight your paths.",
    MBB: "Magtiwala ka sa Panginoon nang buong puso mo at huwag mong pagkatiwalaan ang iyong sariling kaalaman. Kilalanin mo siya sa lahat ng iyong mga lakad at siya ang magtatuwid ng iyong mga landas."
  },
  "Psalm 107:1": {
    ESV: "Oh give thanks to the LORD, for he is good, for his steadfast love endures forever!",
    MBB: "Magpasalamat kayo sa Panginoon, sapagkat siya ay mabuti; ang kanyang tapat na pagmamahal ay magpakailanman."
  },
  "Lamentations 3:22-23": {
    ESV: "The steadfast love of the LORD never ceases; his mercies never come to an end; they are new every morning; great is your faithfulness.",
    MBB: "Ang tapat na pagmamahal ng Panginoon ay hindi natatapos, ang kanyang mga awa ay hindi nauubos. Bago-bago ang mga ito tuwing umaga; dakila ang iyong katapatan."
  },
  "Psalm 46:10": {
    ESV: "\"Be still, and know that I am God. I will be exalted among the nations, I will be exalted in the earth!\"",
    MBB: "'Tumigil kayo at kilalanin na ako ang Diyos; ako ay dadakilain sa mga bansa, ako ay dadakilain sa buong mundo.'"
  },
  "Galatians 2:20": {
    ESV: "I have been crucified with Christ. It is no longer I who live, but Christ who lives in me. And the life I now live in the flesh I live by faith in the Son of God, who loved me and gave himself for me.",
    MBB: "Ako ay napako na sa krus kasama si Cristo; hindi na ako ang nabubuhay, kundi si Cristo ang nabubuhay sa akin. Ang buhay na itinataglay ko ngayon dito sa laman ay isinasabuhay ko sa pananampalataya sa Anak ng Diyos na nagmahal sa akin at nagbigay ng kanyang sarili para sa akin."
  },
  "Psalm 95:2": {
    ESV: "Let us come into his presence with thanksgiving; let us make a joyful noise to him with songs of praise!",
    MBB: "Lumapit tayo sa kanyang harapan na may pagpapasalamat; umawit tayo sa kanya ng mga awit ng papuri."
  },
  "Romans 8:28": {
    ESV: "And we know that for those who love God all things work together for good, for those who are called according to his purpose.",
    MBB: "Nalalaman natin na ang lahat ng bagay ay nagtatulungan para sa ikabubuti ng mga nagmamahal sa Diyos, ng mga tinawag ayon sa kanyang layunin."
  },
  "Colossians 3:15": {
    ESV: "And let the peace of Christ rule in your hearts, to which indeed you were called in one body. And be thankful.",
    MBB: "At hayaan ninyong ang kapayapaan ni Cristo ang mamuno sa inyong mga puso, dahil sa kapayapaan na ito kayo tinawag upang maging isang katawan. At magpasalamat kayo."
  },
  "James 1:3": {
    ESV: "For you know that the testing of your faith produces steadfastness.",
    MBB: "Sapagkat alam ninyo na ang pagsubok sa inyong pananampalataya ay nagbubunga ng pagtitiis."
  },
  "2 Corinthians 9:15": {
    ESV: "Thanks be to God for his inexpressible gift!",
    MBB: "Salamat sa Diyos dahil sa kanyang walang kapantay na kaloob!"
  },
  "Isaiah 40:31": {
    ESV: "But they who wait for the LORD shall renew their strength; they shall mount up with wings like eagles; they shall run and not be weary; they shall walk and not faint.",
    MBB: "Ngunit ang mga naghihintay sa Panginoon ay magbabago ng lakas; sila ay mag-aalaga ng mga pakpak tulad ng mga agila; sila ay tatakbo at hindi mapapagod; sila ay lalakad at hindi manlalata."
  },
  "Numbers 6:24-26": {
    ESV: "The LORD bless you and keep you; the LORD make his face shine on you and be gracious to you; the LORD lift up his countenance upon you and give you peace.",
    MBB: "Pagpalain ka nawa ng Panginoon at ingatan ka; hayagan ka nawa ng Panginoon ng kanyang mukha at maawa sa iyo; iangat nawa ng Panginoon ang kanyang mukha sa iyo at bigyan ka ng kapayapaan."
  },
  "Mark 9:24": {
    ESV: "Immediately the father of the child cried out and said, 'I believe; help my unbelief!'",
    MBB: "Agad na sumigaw ang ama ng bata at nagsabi, 'Naniniwala ako; tulungan mo ang aking kawalan ng pananalig!'"
  },
  "Psalm 9:1": {
    ESV: "I will give thanks to the LORD with my whole heart; I will recount all of your wonderful deeds.",
    MBB: "Magpapasalamat ako sa Panginoon nang buong puso ko; isasalaysay ko ang lahat ng iyong mga kamangha-manghang gawa."
  },
  "Revelation 21:4": {
    ESV: "He will wipe away every tear from their eyes, and death shall be no more, neither shall there be mourning, nor crying, nor pain anymore, for the former things have passed away.",
    MBB: "Papahirin niya ang bawat luha mula sa kanilang mga mata, at hindi na magkakaroon ng kamatayan, ni pagdadalamhati, ni pag-iyak, ni kirot pa man, sapagkat lumipas na ang mga dating bagay."
  },
  "Psalm 23:1-2": {
    ESV: "The LORD is my shepherd; I shall not want. He makes me lie down in green pastures. He leads me beside still waters.",
    MBB: "Ang Panginoon ang aking Pastol; wala akong kakulangan. Pinahahiga niya ako sa mga sariwang pastulan; pinapatnubayan niya ako sa mga payapang tubig."
  },
  "Romans 10:17": {
    ESV: "So faith comes from hearing, and hearing through the word of Christ.",
    MBB: "Kaya nga ang pananampalataya ay nagmumula sa pakikinig, at ang pakikinig ay sa pamamagitan ng salita ni Cristo."
  },
  "Ephesians 2:8-9": {
    ESV: "For by grace you have been saved through faith. And this is not your own doing; it is the gift of God, not a result of works, so that no one may boast.",
    MBB: "Sapagkat kayo ay naligtas sa pamamagitan ng biyaya, sa pamamagitan ng pananampalataya. At ito ay hindi sa inyong sarili; ito ay kaloob ng Diyos, hindi dahil sa mga gawa, upang walang makapagmayabang."
  },
  "Psalm 34:18": {
    ESV: "The LORD is near to the brokenhearted and saves the crushed in spirit.",
    MBB: "Ang Panginoon ay malapit sa mga may pusong nasira at inililigtas ang mga may diwa na nagapi."
  },
  "2 Timothy 1:7": {
    ESV: "For God gave us a spirit not of fear but of power and love and self-control.",
    MBB: "Sapagkat hindi tayo binigyan ng Diyos ng espiritu ng takot, kundi ng kapangyarihan at pagmamahal at disiplina sa sarili."
  },
  "Matthew 5:9": {
    ESV: "Blessed are the peacemakers, for they shall be called sons of God.",
    MBB: "Mapalad ang mga nagtataguyod ng kapayapaan, sapagkat sila ay tatawaging mga anak ng Diyos."
  },
  "Psalm 136:1": {
    ESV: "Give thanks to the LORD, for he is good, for his steadfast love endures forever.",
    MBB: "Magpasalamat sa Panginoon, sapagkat siya ay mabuti; ang kanyang tapat na pagmamahal ay magpakailanman."
  },
  "Psalm 46:1": {
    ESV: "God is our refuge and strength, a very present help in trouble.",
    MBB: "Ang Diyos ay ating kanlungan at lakas, isang tulong na handang-handa sa panahon ng kaguluhan."
  },
  "Romans 8:38-39": {
    ESV: "For I am sure that neither death nor life, nor angels nor rulers, nor things present nor things to come, nor powers, nor height nor depth, nor anything else in all creation, will be able to separate us from the love of God in Christ Jesus our Lord.",
    MBB: "Sapagkat natitiyak ko na ang kamatayan o buhay, ang mga anghel o mga pamunuan, ang mga bagay na kasalukuyan o mga darating, ang mga kapangyarihan, ang taas o lalim, o anumang nilalang ay hindi makapaghihiwalay sa atin mula sa pagmamahal ng Diyos na nasa kay Cristo Jesus na ating Panginoon."
  },
  "Psalm 23:4": {
    ESV: "Even though I walk through the valley of the shadow of death, I will fear no evil, for you are with me; your rod and your staff, they comfort me.",
    MBB: "Kahit maglakad ako sa libis ng lilim ng kamatayan, hindi ako matatakot sa anumang kasamaan, sapagkat ikaw ay kasama ko; ang iyong tungkod at iyong pamalo ay nagpapaaliwan sa akin."
  },
  "Isaiah 43:2": {
    ESV: "When you pass through the waters, I will be with you; and through the rivers, they shall not overwhelm you; when you walk through fire you shall not be burned, and the flame shall not consume you.",
    MBB: "Kapag dumaan ka sa tubig, sasamahan kita; at sa mga ilog, hindi ka malalunod. Kapag lumakad ka sa apoy, hindi ka masusunog; ang liyab ay hindi kakain sa iyo."
  },
  "Ephesians 3:20": {
    ESV: "Now to him who is able to do far more abundantly than all that we ask or think, according to the power at work within us.",
    MBB: "Sa kanya na may kakayahang gumawa ng higit pa sa labis kaysa lahat ng ating hinihingi o inaasahan, ayon sa kapangyarihang gumagawa sa atin."
  },
  "Hebrews 12:1-2": {
    ESV: "Therefore, since we are surrounded by so great a cloud of witnesses, let us also lay aside every weight, and sin which clings so closely, and let us run with endurance the race that is set before us, looking to Jesus, the founder and perfecter of our faith.",
    MBB: "Kaya nga, yamang napapalibutan tayo ng napakaraming saksi, itabi natin ang lahat ng pumipigil sa atin, at ang kasalanang madaling pumailalim sa atin, at patakbuhin nating may pagtitiis ang laro na nakalatag sa harap natin, na nakatingin kay Jesus, ang nagtatag at nagpapasakdal ng ating pananampalataya."
  },
  "Psalm 16:11": {
    ESV: "You make known to me the path of life; in your presence there is fullness of joy; at your right hand are pleasures forevermore.",
    MBB: "Ipinakikilala mo sa akin ang landas ng buhay; sa iyong presensya ay puno ng kagalakan; sa iyong kanan ay mga kasiyahan magpakailanman."
  },
  "Psalm 27:1": {
    ESV: "The LORD is my light and my salvation; whom shall I fear? The LORD is the stronghold of my life; of whom shall I be afraid?",
    MBB: "Ang Panginoon ang aking liwanag at kaligtasan; sino ang aking katatakutan? Ang Panginoon ang kuta ng aking buhay; sino ang aking ikatatakot?"
  },
  "Isaiah 41:10": {
    ESV: "Fear not, for I am with you; be not dismayed, for I am your God; I will strengthen you, I will help you, I will uphold you with my righteous right hand.",
    MBB: "Huwag kang matakot, sapagkat kasama mo ako; huwag kang mabagabag, sapagkat ako ang iyong Diyos. Palalakasin kita, oo, tutulungan kita, oo, aalalayan kita ng aking matuwid na kanang kamay."
  },
  "Joshua 1:9": {
    ESV: "Have I not commanded you? Be strong and courageous. Do not be frightened, and do not be dismayed, for the LORD your God is with you wherever you go.",
    MBB: "Hindi ba kita inutos? Maging matapang at matibay ka. Huwag kang matakot at huwag kang mabagabag, sapagkat kasama mo ang Panginoon mong Diyos saan ka man pumunta."
  },
  "Philippians 4:13": {
    ESV: "I can do all things through him who strengthens me.",
    MBB: "Kaya ko ang lahat ng bagay sa pamamagitan niya na nagbibigay sa akin ng lakas."
  },
  "Psalm 119:105": {
    ESV: "Your word is a lamp to my feet and a light to my path.",
    MBB: "Ang iyong salita ay isang ilaw sa aking mga paa at isang liwanag sa aking landas."
  },
  "Joshua 1:9 ": {
    ESV: "Be strong and courageous. Do not be frightened, and do not be dismayed.",
    MBB: "Maging matapang at matibay ka. Huwag kang matakot at huwag kang mabagabag."
  },
  "John 15:5": {
    ESV: "I am the vine; you are the branches. Whoever abides in me and I in him, he it is that bears much fruit, for apart from me you can do nothing.",
    MBB: "Ako ang puno ng ubas; kayo ang mga sanga. Ang nananatili sa akin, at ako sa kanya, ay nagbubunga ng marami, sapagkat wala kayong magagawa nang wala ako."
  },
  "Romans 8:1": {
    ESV: "There is therefore now no condemnation for those who are in Christ Jesus.",
    MBB: "Kaya nga, wala nang hatol na kaparusahan para sa mga nasa kay Cristo Jesus."
  },
  "Revelation 21:5": {
    ESV: "And he who was seated on the throne said, 'Behold, I am making all things new.'",
    MBB: "At sinabi ng nakaupo sa trono, 'Narito, ginagawa ko ang lahat ng bagay na bago.'"
  },
  "1 Peter 5:7": {
    ESV: "Casting all your anxieties on him, because he cares for you.",
    MBB: "Ibulalas sa kanya ang lahat ng inyong mga kabalisahan, sapagkat siya ay nagmamalasakit sa inyo."
  },
  "Matthew 11:28-30": {
    ESV: "Come to me, all who labor and are heavy laden, and I will give you rest. Take my yoke upon you, and learn from me, for I am gentle and lowly in heart, and you will find rest for your souls. For my yoke is easy, and my burden is light.",
    MBB: "Halina sa akin, kayong lahat na nahihirapan at nabibigatan, at bibigyan ko kayo ng pahinga. Pasanin ninyo ang aking pamatok at matuto kayo mula sa akin, sapagkat ako ay maamo at mapagpakumbabang-puso, at makasusumpong kayo ng pahinga para sa inyong mga kaluluwa. Sapagkat ang aking pamatok ay maginhawa at ang aking pasanin ay magaan."
  },
  "Jeremiah 31:3": {
    ESV: "The LORD appeared to him from far away. I have loved you with an everlasting love; therefore I have continued my faithfulness to you.",
    MBB: "Lumitaw ang Panginoon sa kanya mula sa malayo. 'Inibig kita ng walang hanggang pagmamahal; kaya naman patuloy kong ipinagpapanatili ang aking tapat na pagmamahal para sa iyo.'"
  },
  "Matthew 6:33": {
    ESV: "But seek first the kingdom of God and his righteousness, and all these things will be added to you.",
    MBB: "Ngunit hanapin muna ninyo ang kanyang kaharian at ang kanyang katuwiran, at ang lahat ng mga bagay na ito ay idadagdag sa inyo."
  },
  "2 Corinthians 5:7": {
    ESV: "For we walk by faith, not by sight.",
    MBB: "Sapagkat namumuhay tayo sa pananampalataya, hindi sa paningin."
  },
  "Galatians 5:22-23": {
    ESV: "But the fruit of the Spirit is love, joy, peace, patience, kindness, goodness, faithfulness, gentleness, self-control; against such things there is no law.",
    MBB: "Ngunit ang bunga ng Espiritu ay pagmamahal, kagalakan, kapayapaan, pagtitiis, kabaitan, kabutihan, katapatan, kaamuan, pagpipigil sa sarili; laban sa mga bagay na ito ay walang kautusan."
  },
  "James 1:5": {
    ESV: "If any of you lacks wisdom, let him ask God, who gives generously to all without reproach, and it will be given him.",
    MBB: "Kung ang sinuman sa inyo ay kulang sa karunungan, humingi siya sa Diyos, na nagbibigay nang sagana sa lahat nang walang pag-aalinlangan, at ibibigay sa kanya."
  },
  "Psalm 46:10 ": {
    ESV: "Be still, and know that I am God.",
    MBB: "Tumigil kayo at kilalanin na ako ang Diyos."
  },
  "John 3:17": {
    ESV: "For God did not send his Son into the world to condemn the world, but in order that the world might be saved through him.",
    MBB: "Sapagkat hindi sinugo ng Diyos ang kanyang Anak sa mundo upang hatulan ang mundo, kundi upang ang mundo ay maligtas sa pamamagitan niya."
  },
  "John 10:10": {
    ESV: "The thief comes only to steal and kill and destroy. I came that they may have life and have it abundantly.",
    MBB: "Ang magnanakaw ay pumaparito lamang upang magnakaw at pumatay at manira. Naparito ako upang magkaroon sila ng buhay at magkaroon ng kasaganaan."
  },
  "1 John 4:19": {
    ESV: "We love because he first loved us.",
    MBB: "Mahal natin siya sapagkat siya ang unang nagmahal sa atin."
  },
  "Psalm 139:14": {
    ESV: "I praise you, for I am fearfully and wonderfully made. Wonderful are your works; my soul knows it very well.",
    MBB: "Pupurihin kita, sapagkat kamangha-mangha at kahanga-hangang ang aking pagkakagawa; kamangha-mangha ang iyong mga gawa, at alam ito ng aking kaluluwa nang lubos."
  },
  "Revelation 3:20": {
    ESV: "Behold, I stand at the door and knock. If anyone hears my voice and opens the door, I will come in to him and eat with him, and he with me.",
    MBB: "Narito, nakatayo ako sa pintuan at tumatawag. Kung ang sinuman ay marinig ang aking tinig at buksan ang pintuan, papasok ako sa kanya at kakain ako kasama niya, at siya kasama ko."
  },
  "Romans 8:28": {
    ESV: "And we know that for those who love God all things work together for good, for those who are called according to his purpose.",
    MBB: "Nalalaman natin na ang lahat ng bagay ay nagtatulungan para sa ikabubuti ng mga nagmamahal sa Diyos, ng mga tinawag ayon sa kanyang layunin."
  },
  "1 John 1:9": {
    ESV: "If we confess our sins, he is faithful and just to forgive us our sins and to cleanse us from all unrighteousness.",
    MBB: "Kung ipinagtapat natin ang ating mga kasalanan, siya ay tapat at matuwid na magpapatawad sa ating mga kasalanan at maglilinis sa atin mula sa lahat ng kalikuan."
  },
  "Philippians 4:8": {
    ESV: "Finally, brothers, whatever is true, whatever is honorable, whatever is just, whatever is pure, whatever is lovely, whatever is commendable, if there is any excellence, if there is anything worthy of praise, think about these things.",
    MBB: "Sa wakas, mga kapatid, kung ano man ang totoo, kung ano man ang kagalang-galang, kung ano man ang matuwid, kung ano man ang dalisay, kung ano man ang kaibig-ibig, kung ano man ang kapuri-puri, kung may anumang kahusayan, kung may anumang bagay na kapuri-puri, isipin ninyo ang mga bagay na ito."
  },
  "Romans 12:2": {
    ESV: "Do not be conformed to this world, but be transformed by the renewal of your mind, that by testing you may discern what is the will of God, what is good and acceptable and perfect.",
    MBB: "At huwag kayong makiayon sa mundong ito, kundi magbago kayo sa pamamagitan ng pagbabago ng inyong isipan, upang mapatunayan ninyo kung ano ang kalooban ng Diyos, kung ano ang mabuti at kaaya-aya at ganap."
  },
  "1 John 3:1": {
    ESV: "See what kind of love the Father has given to us, that we should be called children of God; and so we are.",
    MBB: "Tingnan ninyo kung gaano kalaking pagmamahal ang ipinagkaloob ng Ama sa atin, upang tayo ay tawaging mga anak ng Diyos; at iyon nga tayo."
  },
  "Romans 3:23-24": {
    ESV: "For all have sinned and fall short of the glory of God, and are justified by his grace as a gift, through the redemption that is in Christ Jesus.",
    MBB: "Sapagkat ang lahat ay nagkasala at kulang sa kaluwalhatian ng Diyos, at sila ay inaring-ganap nang walang bayad sa pamamagitan ng kanyang biyaya sa pamamagitan ng pagtutubos na nasa kay Cristo Jesus."
  },
  "Romans 6:23": {
    ESV: "For the wages of sin is death, but the free gift of God is eternal life in Christ Jesus our Lord.",
    MBB: "Sapagkat ang kabayaran ng kasalanan ay kamatayan, ngunit ang kaloob ng Diyos ay buhay na walang hanggan kay Cristo Jesus na ating Panginoon."
  },
  "John 8:32": {
    ESV: "And you will know the truth, and the truth will set you free.",
    MBB: "At makikilala ninyo ang katotohanan, at ang katotohanan ang magpapalaya sa inyo."
  },
  "2 Timothy 1:7": {
    ESV: "For God gave us a spirit not of fear but of power and love and self-control.",
    MBB: "Sapagkat hindi tayo binigyan ng Diyos ng espiritu ng takot, kundi ng kapangyarihan at pagmamahal at disiplina sa sarili."
  },
  "Zephaniah 3:17": {
    ESV: "The LORD your God is in your midst, a mighty one who will save; he will rejoice over you with gladness; he will quiet you by his love; he will exult over you with loud singing.",
    MBB: "Ang Panginoon mong Diyos ay nasa gitna mo, isang makapangyarihang manliligtas; magagalak siya sa iyo nang may tuwa; patatahimikin ka niya ng kanyang pagmamahal; magagalak siya sa iyo nang may malakas na pag-awit."
  },
  "Psalm 37:4": {
    ESV: "Delight yourself in the LORD, and he will give you the desires of your heart.",
    MBB: "Magsaya ka sa Panginoon, at bibigyan ka niya ng mga hangarin ng iyong puso."
  },
  "Luke 1:37": {
    ESV: "For nothing will be impossible with God.",
    MBB: "Sapagkat walang imposible sa Diyos."
  },
  "Hebrews 11:6": {
    ESV: "And without faith it is impossible to please him, for whoever would draw near to God must believe that he exists and that he rewards those who seek him.",
    MBB: "At kung wala ang pananampalataya ay imposibleng makalugod sa kanya, sapagkat ang sinumang lumalapit sa Diyos ay dapat na maniniwala na siya ay umiiral at na siya ay nagbibigay-gantimpala sa mga naghahanap sa kanya."
  }
};

// Default translations for verses not in the map above
function getDefaultTranslations(nivText) {
  return {
    NIV: nivText,
    ESV: nivText, // fallback to NIV if no ESV available
    MBB: nivText  // fallback to NIV if no MBB available
  };
}

// ---------------------------------------------------------------------------
// Transform verses.json
// ---------------------------------------------------------------------------
const versesPath = path.join(__dirname, 'shared', 'verses.json');
const data = JSON.parse(fs.readFileSync(versesPath, 'utf8'));

let updated = 0;
let fallback = 0;

data.verses = data.verses.map(verse => {
  const ref = verse.reference;
  const t = TRANSLATIONS[ref];

  if (t) {
    updated++;
    return {
      id: verse.id,
      dayOfYear: verse.dayOfYear,
      reference: verse.reference,
      translations: {
        NIV: verse.text,
        ESV: t.ESV,
        MBB: t.MBB
      },
      reflection: verse.reflection,
      quietTimePrompt: verse.quietTimePrompt,
      category: verse.category
    };
  } else {
    fallback++;
    return {
      id: verse.id,
      dayOfYear: verse.dayOfYear,
      reference: verse.reference,
      translations: {
        NIV: verse.text,
        ESV: verse.text,  // same as NIV until ESV added
        MBB: verse.text   // same as NIV until MBB added
      },
      reflection: verse.reflection,
      quietTimePrompt: verse.quietTimePrompt,
      category: verse.category
    };
  }
});

fs.writeFileSync(versesPath, JSON.stringify(data, null, 2), 'utf8');
fs.copyFileSync(versesPath, path.join(__dirname, 'extension', 'verses.json'));

console.log(`Done. Updated with full translations: ${updated}, using NIV fallback: ${fallback}`);
console.log(`Total verses: ${data.verses.length}`);

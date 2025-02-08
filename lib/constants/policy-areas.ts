// Types
export type PolicyAreaDescription = {
  official: string;
  ai_summarized: string;
};

export type PolicyAreaKey = string;

// Use a const assertion to ensure the object is read-only
export const PolicyAreas: Record<PolicyAreaKey, PolicyAreaDescription> = {
  "Agriculture and Food": {
    official:
      "Primary focus of measure is agricultural practices; agricultural prices and marketing; agricultural education; food assistance or nutrition programs; food industry, supply, and safety; aquaculture; horticulture and plants. Measures concerning international trade in agricultural products may fall under Foreign Trade and International Finance policy area.",
    ai_summarized:
      "This policy is about farming, food safety, food programs, and how food is produced and traded.",
  },
  Animals: {
    official:
      "Primary focus of measure is animal protection; human-animal relationships; wildlife conservation and habitat protection; veterinary medicine. Measures concerning endangered or threatened species may fall under Environmental Protection policy area. Measures concerning wildlife refuge matters may fall under Public Lands and Natural Resources policy area",
    ai_summarized:
      "This policy is about protecting animals, wildlife, and ensuring their health and safety.",
  },
  "Armed Forces and National Security": {
    official:
      "Primary focus of measure is military operations and spending, facilities, procurement and weapons, personnel, intelligence; strategic materials; war and emergency powers; veterans’ issues. Measures concerning alliances and collective security, arms sales and military assistance, or arms control may fall under International Affairs policy area.",
    ai_summarized:
      "This policy is about military operations, defense spending, veterans' issues, and general national security.",
  },
  "Arts, Culture, Religion": {
    official:
      "Primary focus of measure is art, literature, performing arts in all formats; arts and humanities funding; libraries, exhibitions, cultural centers; sound recording, motion pictures, television and film; cultural property and resources; cultural relations; and religion. Measures concerning intellectual property aspects of the arts may fall under Commerce policy area. Measures concerning religious freedom may fall under Civil Rights and Liberties, Minority Issues policy area.",
    ai_summarized:
      "Focuses on funding and promoting arts, literature, media, cultural institutions, museums, and religious matters, including protecting cultural heritage and supporting creative work.",
  },
  "Civil Rights and Liberties, Minority Issues": {
    official:
      "Primary focus of measure is discrimination on basis of race, ethnicity, age, sex, gender, health or disability; First Amendment rights; due process and equal protection; abortion rights; privacy. Measures concerning abortion rights and procedures may fall under Health policy area.",
    ai_summarized:
      "This policy is about protecting individual rights, fighting discrimination, and ensuring equal treatment for all.",
  },
  Commerce: {
    official:
      "Primary focus of measure is business investment, development, regulation; small business; consumer affairs; competition and restrictive trade practices; manufacturing, distribution, retail; marketing; intellectual property. Measures concerning international competitiveness and restrictions on imports and exports may fall under Foreign Trade and International Finance policy area.",
    ai_summarized:
      "This policy covers business regulations, trade, intellectual property, and consumer protections.",
  },
  Congress: {
    official:
      "Primary focus of measure is Members of Congress; general congressional oversight; congressional agencies, committees, operations; legislative procedures; U.S. Capitol. Measures concerning oversight and investigation of specific matters may fall under the issue-specific relevant policy area.",
    ai_summarized:
      "Covers funding, operations, members, committees, procedures, and oversight duties of Congress.",
  },
  "Crime and Law Enforcement": {
    official:
      "Primary focus of measure is criminal offenses, investigation and prosecution, procedure and sentencing; corrections and imprisonment; juvenile crime; law enforcement administration; controlled substances regulation. Measures concerning terrorism may fall under Emergency Management or International Affairs policy areas.",
    ai_summarized:
      "Deals with investigating, prosecuting and punishing crime, including police work, prisons, drug laws, and how criminal cases move through the justice system.",
  },
  "Economics and Public Finance": {
    official:
      "Primary focus of measure is budgetary matters such as appropriations, public debt, the budget process, government lending, government accounts and trust funds; monetary policy and inflation; economic development, performance, and economic theory.",
    ai_summarized:
      "This policy is about government spending, the economy, inflation, and managing public finances.",
  },
  Education: {
    official:
      "Primary focus of measure is elementary, secondary, or higher education including special education and matters of academic performance, school administration, teaching, educational costs, and student aid. Measures concerning college sports (including NCAA) may fall under Sports and Recreation policy area.",
    ai_summarized:
      "Covers education funding, schools and universities, student aid, academic standards, teaching, and administration.",
  },
  "Emergency Management": {
    official:
      "Primary focus of measure is emergency planning; response to civil disturbances, natural and other disasters, including fires; emergency communications; security preparedness.",
    ai_summarized:
      "This policy covers disaster planning, emergency responses, and preparedness for emergencies.",
  },
  Energy: {
    official:
      "Primary focus of measure is all sources and supplies of energy, including alternative energy sources, oil and gas, coal, nuclear power; efficiency and conservation; costs, prices, and revenues; electric power transmission; public utility matters.",
    ai_summarized:
      "Covers energy costs, production (including drilling, fracking, mining), power transmission from all sources (oil, gas, nuclear, renewable), and conservation efforts.",
  },
  "Environmental Protection": {
    official:
      "Primary focus of measure is regulation of pollution including from hazardous substances and radioactive releases; climate change and greenhouse gases; environmental assessment and research; solid waste and recycling; ecology. Measures concerning energy exploration, efficiency, and conservation may fall under Energy policy area.",
    ai_summarized:
      "This policy focuses on protecting the environment, controlling pollution, and addressing climate change.",
  },
  Families: {
    official:
      "Primary focus of measure is child and family welfare, services, and relationships; marriage and family status; domestic violence and child abuse. Measures concerning public assistance programs or aging may fall under Social Welfare policy area.",
    ai_summarized:
      "This policy focuses on family welfare, child protection, and supporting relationships and services for families.",
  },
  "Finance and Financial Sector": {
    official:
      "Primary focus of measure is U.S. banking and financial institutions regulation; consumer credit; bankruptcy and debt collection; financial services and investments; insurance; securities; real estate transactions; currency. Measures concerning financial crimes may fall under Crime and Law Enforcement. Measures concerning business and corporate finance may fall under Commerce policy area. Measures concerning international banking may fall under Foreign Trade and International Finance policy area.",
    ai_summarized:
      "This policy is about regulating banking, financial services, investments, and consumer protection in finance.",
  },
  "Foreign Trade and International Finance": {
    official:
      "Primary focus of measure is competitiveness, trade barriers and adjustment assistance; foreign loans and international monetary system; international banking; trade agreements and negotiations; customs enforcement, tariffs, and trade restrictions; foreign investment. Measures concerning border enforcement may fall under Immigration policy area.",
    ai_summarized:
      "This policy is all about how countries do business with each other. It covers things like trade deals, tariffs (aka taxes on imports), and rules for international banking and loans. It also involves customs enforcement, which is about making sure the right taxes are paid on goods coming into the country.",
  },
  "Government Operations and Politics": {
    official:
      "Primary focus of measure is government administration, including agency organization, contracting, facilities and property, information management and services; rulemaking and administrative law; elections and political activities; government employees and officials; Presidents; ethics and public participation; postal service. Measures concerning agency appropriations and the budget process may fall under Economics and Public Finance policy area.",
    ai_summarized:
      "This policy area is about how the government runs itself day-to-day. It covers the nitty-gritty of managing government agencies, like how they're organized, how they make rules, and how they handle information.",
  },
  Health: {
    official:
      "Primary focus of measure is science or practice of the diagnosis, treatment, and prevention of disease; health services administration and funding, including such programs as Medicare and Medicaid; health personnel and medical education; drug use, safety, treatment, and research; health care coverage and insurance; health facilities. Measures concerning controlled substances and drug trafficking may fall under Crime and Law Enforcement policy area.",
    ai_summarized:
      "This policy is about healthcare, medical treatment, disease prevention, and health programs like Medicare.",
  },
  "Housing and Community Development": {
    official:
      "Primary focus of measure is home ownership; housing programs administration and funding; residential rehabilitation; regional planning, rural and urban development; affordable housing; homelessness; housing industry and construction; fair housing. Measures concerning mortgages and mortgage finance may fall under Finance and Financial Sector policy area.",
    ai_summarized:
      "This policy focuses on housing, homeownership, affordable housing, and urban development.",
  },
  Immigration: {
    official:
      "Primary focus of measure is administration of immigration and naturalization matters; immigration enforcement procedures; customs and border protection; refugees and asylum policies; travel and residence documentation for non-U.S. nationals, such as visas; foreign labor; benefits for immigrants. Measures concerning smuggling and trafficking of persons and controlled substances may fall under Crime and Law Enforcement policy area. Measures concerning refugees may fall under International Affairs policy area.",
    ai_summarized:
      "This policy deals with immigration, visas, border control, and refugee services.",
  },
  "International Affairs": {
    official:
      "Primary focus of measure is matters affecting foreign aid, human rights, international law and organizations; national governance; passports for U.S. nationals; arms control; diplomacy and foreign officials; alliances and collective security. Measures concerning trade agreements, tariffs, foreign investments, and foreign loans may fall under Foreign Trade and International Finance policy area.",
    ai_summarized:
      "All aspects of U.S. relations with other countries, from providing assistance and upholding human rights to managing diplomats and establishing security partnerships",
  },
  "Labor and Employment": {
    official:
      "Primary focus of measure is matters affecting hiring and composition of the workforce, wages and benefits, labor-management relations; occupational safety, personnel management, unemployment compensation, pensions. Measures concerning public-sector employment may fall under Government Operations and Politics policy area.",
    ai_summarized:
      "This policy is about the workforce, wages, employment rights, and workplace safety.",
  },
  Law: {
    official:
      "Primary focus of measure is matters affecting civil actions and administrative remedies, courts and judicial administration, general constitutional issues, dispute resolution, including mediation and arbitration. Measures concerning specific constitutional amendments may fall under the policy area relevant to the subject matter of the amendment (e.g., Education). Measures concerning criminal procedure and law enforcement may fall under Crime and Law Enforcement policy area.",
    ai_summarized:
      "This policy is about laws, courts, legal processes, and dispute resolutions.",
  },
  "Native Americans": {
    official:
      "Primary focus of measure is matters affecting Native Americans, including Alaska Natives and Hawaiians, in a variety of domestic policy settings. This includes claims, intergovernmental relations, and Indian lands and resources.",
    ai_summarized:
      "This policy focuses on Native American rights, lands, and cultural matters.",
  },
  "Public Lands and Natural Resources": {
    official:
      "Primary focus of measure is natural areas (including wilderness); lands under government jurisdiction; land use practices and policies; parks, monuments, and historic sites; fisheries and marine resources; mining and minerals; emergency wildfire mitigation and disaster relief on federal lands. Measures concerning energy supplies and production may fall under Energy policy area.",
    ai_summarized:
      "This policy covers public lands, parks, natural resources, and managing federal lands.",
  },
  "Science, Technology, Communications": {
    official:
      "Primary focus of measure is natural sciences, space exploration, research policy and funding, research and development, STEM education, scientific cooperation and communication; technology policies, telecommunication, information technology; digital media, journalism. Measures concerning scientific education may fall under Education policy area.",
    ai_summarized:
      "This policy deals with science research, technology, space exploration, and communications.",
  },
  "Social Sciences and History": {
    official:
      "Primary focus of measure is policy sciences, history, matters related to the study of society. Measures concerning particular aspects of government functions may fall under Government Operations and Politics policy area.",
    ai_summarized:
      "This policy focuses on social sciences, history, and understanding society.",
  },
  "Social Welfare": {
    official:
      "Primary focus of measure is public assistance and Social Security programs; social services matters, including community service, volunteer, and charitable activities. Measures concerning such health programs as Medicare and Medicaid may fall under Health policy area.",
    ai_summarized:
      "This policy is about social services, public assistance, and programs like Social Security and welfare.",
  },
  "Sports and Recreation": {
    official:
      "Primary focus of measure is youth, amateur, college (including NCAA) and professional athletics; outdoor recreation; sports and recreation facilities. Measures concerning recreation areas may fall under Public Lands and Natural Resources policy area.",
    ai_summarized:
      "This policy is about sports, recreation activities, and facilities for youth, amateurs, and professionals.",
  },
  Taxation: {
    official:
      "Primary focus of measure is all aspects of income, excise, property, inheritance, and employment taxes; tax administration and collection. Measures concerning state and local finance may fall under Economics and Public Finance policy area.",
    ai_summarized:
      "This policy is about all types of taxes like income, property, and employment taxes, along with their collection.",
  },
  "Transportation and Public Works": {
    official:
      "Primary focus of measure is all aspects of transportation modes and conveyances, including funding and safety matters; Coast Guard; infrastructure development; travel and tourism. Measures concerning water resources and navigation projects may fall under Water Resources Development policy area.",
    ai_summarized:
      "This policy deals with transportation, infrastructure, and safety in travel and public works projects.",
  },
  "Water Resources Development": {
    official:
      "Primary focus of measure is the supply and use of water and control of water flows; watersheds; floods and storm protection; wetlands. Measures concerning water quality may fall under Environmental Protection policy area.",
    ai_summarized:
      "This policy is about managing water resources, flood control, and protecting water supplies.",
  },
  Unknown: {
    official: "The government did not properly keep track of this information.",
    ai_summarized:
      "The government did not properly keep track of this information.",
  },
} as const;

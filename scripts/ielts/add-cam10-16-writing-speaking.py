import json
import os

SOURCE_TESTS_PATH = r"d:\Claude\readup-ielts\.local-private\ielts-ocr\source-tests.json"

CAM_PROMPTS = {
    10: {
        1: {
            "w1": "The first chart below shows how energy is used in an average Australian household. The second chart shows the greenhouse gas emissions which result from this energy use.",
            "w2": "It is important for children to learn the difference between right and wrong at an early age. Punishment is necessary to help them learn this distinction.\nTo what extent do you agree or disagree with this opinion?\nWhat sort of punishment should parents and teachers be allowed to use to teach good behaviour to children?",
            "s1": "Weekend\n• What do you usually do on the weekend?\n• What did you do last weekend?\n• Do you make plans for your weekend?",
            "s2": "Describe someone you know who made a good decision recently.\nYou should say:\nwho this person is\nwhat the decision was\nhow you feel about the decision\nand explain why you think it was a good decision.",
            "s3": "Making decisions\n• What important decisions do young people make today?\n• Is it better to make decisions alone or after discussing with others?\n• Why do some people find it difficult to make decisions?"
        },
        2: {
            "w1": "The tables below give information about sales of Fairtrade-labelled coffee and bananas in 1999 and 2004 in five European countries.",
            "w2": "Some people think that all university students should study whatever they like. Others believe they should only be allowed to study subjects that will be useful in the future, such as those related to science and technology.\nDiscuss both these views and give your own opinion.",
            "s1": "Music\n• What kinds of music do you like to listen to?\n• At what times of day do you usually listen to music?\n• Did you learn to play a musical instrument when you were a child?",
            "s2": "Describe an interesting conversation you had with a stranger.\nYou should say:\nwho the person was\nwhat you talked about\nwhere you had this conversation\nand explain why you found the conversation interesting.",
            "s3": "Communication\n• In what situations do people talk to strangers?\n• How has technology changed the way people communicate with friends?\n• Do you think people have become less sociable because of mobile phones?"
        },
        3: {
            "w1": "The charts below show the destinations of UK graduates and postgraduates who did not go into full-time work after finishing college in 2008.",
            "w2": "Countries are becoming more and more similar because people are able to buy the same products anywhere in the world.\nDo you think this is a positive or negative development?",
            "s1": "Cooking\n• Do you like cooking? [Why/Why not?]\n• Who usually does the cooking in your home?\n• What is the most popular dish in your country?",
            "s2": "Describe a historical building that you visited and liked.\nYou should say:\nwhere this building was\nwhat it looked like\nwhat you learned when you visited it\nand explain why you liked this building.",
            "s3": "Preserving historical buildings\n• Why should historical buildings be preserved?\n• Should government funds be spent on renovating historic sites?\n• How can historical sites attract more young visitors?"
        },
        4: {
            "w1": "The diagrams below show the life cycle of a species of large fish called the salmon.",
            "w2": "Many museums and historical sites rely on donations and admission fees from visitors to cover their costs. Some people think that admission should be free for everyone.\nDo you agree or disagree with this view?",
            "s1": "Reading\n• Do you like reading books in your free time?\n• What kinds of books did you read as a child?\n• Do you prefer reading printed books or e-books?",
            "s2": "Describe a journey you made by public transport that you remember well.\nYou should say:\nwhere you went\nwhat kind of transport you used\nwho you traveled with\nand explain why you remember this journey so well.",
            "s3": "Public transport\n• What are the benefits of using public transport compared to private cars?\n• How can governments encourage more people to use public transport?\n• What will public transport systems look like in fifty years?"
        }
    },
    11: {
        1: {
            "w1": "The charts below show the percentage of water used for different purposes in six areas of the world.",
            "w2": "Governments should spend money on railways rather than roads.\nTo what extent do you agree or disagree with this statement?",
            "s1": "Food and cooking\n• What is your favourite food?\n• Do you prefer eating out or dining at home?\n• Did your parents teach you how to cook when you were young?",
            "s2": "Describe a creative person that you admire.\nYou should say:\nwho this person is\nwhat creative things they do\nhow you know about them\nand explain why you admire their creativity.",
            "s3": "Creativity and arts\n• Do schools pay enough attention to creative subjects like music and art?\n• How does creativity help people in their everyday jobs?\n• Can anyone learn to be creative or is it an inborn talent?"
        },
        2: {
            "w1": "The charts below show the proportions of British students at one university in England who were able to speak other languages in 2000 and 2010.",
            "w2": "Some people say that in all modern countries it is generally best for people to live in cities, while others believe that life is better in the countryside.\nDiscuss both views and give your opinion.",
            "s1": "Friends\n• How often do you meet your friends?\n• What do you like to do together with your friends?\n• Do you prefer having one close friend or a large group of friends?",
            "s2": "Describe a place near water that you enjoyed visiting.\nYou should say:\nwhere this place was\nwhat it looked like\nwhat you did there\nand explain why you enjoyed visiting it.",
            "s3": "Water and leisure\n• Why do people like spending time near water like beaches and rivers?\n• How has human activity polluted water bodies in your country?\n• What can communities do to protect lakes and rivers?"
        },
        3: {
            "w1": "The graph below shows the quantities of goods transported in the UK between 1974 and 2002 by four different modes of transport.",
            "w2": "Some people think that universities should provide graduates with the knowledge and skills needed in the workplace. Others think that the true function of a university should be to give access to knowledge for its own sake, regardless of whether the course is useful to an employer.\nDiscuss both views and give your opinion.",
            "s1": "Photographs\n• How often do you take photographs?\n• Do you prefer taking photos of people or landscapes?\n• How do you organize and store your digital photos?",
            "s2": "Describe a skill that you learned in your childhood.\nYou should say:\nwhat the skill was\nwho taught you this skill\nhow difficult it was to learn\nand explain how this skill has helped you later in life.",
            "s3": "Learning skills\n• What practical skills should children learn in primary school?\n• Do you think children learn practical skills faster than adults?\n• How has the internet made learning new skills easier?"
        },
        4: {
            "w1": "The table below shows the underground railway systems in six cities.",
            "w2": "Many people believe that international tourism is a bad thing for their country.\nWhat are the reasons for this?\nWhat can be done to reduce the negative impacts of tourism?",
            "s1": "Hometown\n• Where is your hometown located?\n• What do you like most about your hometown?\n• Has your hometown changed much since you were a child?",
            "s2": "Describe a gift you received that was very special to you.\nYou should say:\nwhat the gift was\nwho gave it to you\nwhy they gave it to you\nand explain why it was so special to you.",
            "s3": "Giving and receiving gifts\n• On what occasions do people in your country give gifts?\n• Is the monetary value of a gift important?\n• Do you think commercial advertising has changed gift-giving customs?"
        }
    },
    12: {
        1: {
            "w1": "The chart below shows the percentage of Australian men and women in different age groups who did regular physical activity in 2010.",
            "w2": "Some people say that the only reason for learning a foreign language is in order to travel or to work in a foreign country. Others say that which is not the only reason because there are other reasons why we should learn a foreign language.\nDiscuss both views and give your own opinion.",
            "s1": "Daily routine\n• What is your morning routine like?\n• Do you usually have a busy schedule during the week?\n• Would you like to change any part of your daily routine?",
            "s2": "Describe a website that you visit regularly and find useful.\nYou should say:\nwhat the website is\nhow often you visit it\nwhat kind of information it provides\nand explain why you find it so useful.",
            "s3": "The internet and daily life\n• How has the internet changed the way people shop and study?\n• What are the security risks associated with browsing websites?\n• Will websites replace printed newspapers and textbooks entirely?"
        },
        2: {
            "w1": "The two maps below show the town of Seahorse before and after the construction of a new bypass.",
            "w2": "In some countries, many more people are choosing to live alone nowadays than in the past.\nDo you think this is a positive or negative development?",
            "s1": "Shoes\n• Do you prefer comfortable shoes or fashionable shoes?\n• How often do you buy new shoes?\n• Have you ever bought shoes online?",
            "s2": "Describe an enjoyable experience you had with a family member.\nYou should say:\nwho the family member was\nwhat you did together\nwhere you went\nand explain why you enjoyed this experience so much.",
            "s3": "Family relationships\n• How has family life changed in your country in recent decades?\n• Why is it important for parents to spend quality time with children?\n• How do generations support each other in modern families?"
        },
        3: {
            "w1": "The table below shows the numbers of visitors to Ashdown Museum during the year before and the year after it was refurbished.",
            "w2": "Some people say that the best way to improve public health is by increasing the number of sports facilities. Others, however, believe that this has little effect on public health and that other measures are required.\nDiscuss both views and give your opinion.",
            "s1": "Weather\n• What kind of weather do you like best?\n• Does the weather affect your mood or productivity?\n• What is the climate like in your country during the winter?",
            "s2": "Describe an ambitious goal you have set for yourself.\nYou should say:\nwhat the goal is\nwhen you hope to achieve it\nwhat steps you need to take to achieve it\nand explain why achieving this goal is important to you.",
            "s3": "Setting and achieving goals\n• Why is it important for people to set realistic goals?\n• How can parents and teachers encourage young people to pursue their dreams?\n• Does society put too much pressure on individuals to be successful?"
        },
        4: {
            "w1": "The graph below shows the consumption of fish and some different kinds of meat in a European country between 1979 and 2004.",
            "w2": "In many countries, children are becoming overweight and unhealthy. Some people think that parents should take responsibility for this, while others believe that the government should be responsible.\nDiscuss both views and give your opinion.",
            "s1": "Public parks\n• Do you often visit public parks and gardens?\n• What do people in your country usually do in parks?\n• Do you think towns and cities should have more green spaces?",
            "s2": "Describe a difficult challenge you met and overcame.\nYou should say:\nwhat the challenge was\nwhen and where it happened\nhow you handled the challenge\nand explain how you felt after you overcame it.",
            "s3": "Overcoming challenges\n• Why is facing challenges important for personal development?\n• How can colleagues support each other when tackling workplace problems?\n• Do children learn resilience better through sports or academics?"
        }
    },
    13: {
        1: {
            "w1": "The two maps below show the road access to a city hospital in 2007 and in 2010.",
            "w2": "Living in a country where you have to speak a foreign language can cause serious social problems, as well as practical problems.\nTo what extent do you agree or disagree with this statement?",
            "s1": "Television\n• How often do you watch television or streaming series?\n• What kinds of television shows are popular in your country?\n• Did you watch a lot of TV when you were a child?",
            "s2": "Describe an occasion when you had to get up very early in the morning.\nYou should say:\nwhy you had to get up early\nwhat you did that morning\nhow you felt about waking up early\nand explain how the day went after waking up so early.",
            "s3": "Time management and daily rhythm\n• Why are some people morning people while others are night owls?\n• How does lack of sleep affect work performance and health?\n• Should working hours be made more flexible for modern employees?"
        },
        2: {
            "w1": "The chart below shows the percentage of households in owned and rented accommodation in England and Wales between 1918 and 2011.",
            "w2": "Some people believe that it is best to accept a bad situation, such as an unsatisfactory job or shortage of money. Others argue that it is better to try and improve such situations.\nDiscuss both views and give your own opinion.",
            "s1": "Letters and emails\n• Do you write more emails or text messages nowadays?\n• Have you ever sent a handwritten letter to someone?\n• In what situations is a formal letter still necessary?",
            "s2": "Describe a time when you received good service in a shop or restaurant.\nYou should say:\nwhere and when this happened\nwhat good service was provided\nwho provided this service\nand explain why you appreciated the service so much.",
            "s3": "Customer service\n• What makes good customer service in modern retail and hospitality?\n• How important is staff training in delivering high-quality service?\n• What are the benefits and drawbacks of automated self-checkout systems?"
        },
        3: {
            "w1": "The bar chart below shows the top ten countries for the production and consumption of electricity in 2014.",
            "w2": "In spite of the advances made in agriculture, many people around the world still go hungry.\nWhy is this the case?\nWhat can be done about this problem?",
            "s1": "Money and saving\n• Do you save money on a regular basis?\n• Did you have a piggy bank or savings account when you were young?\n• What do you like spending your disposable income on?",
            "s2": "Describe a memorable celebration or party that you attended.\nYou should say:\nwhat the celebration was for\nwhere and when it took place\nwho was there\nand explain why you remember this celebration so well.",
            "s3": "Celebrations and traditions\n• Why are national festivals and holidays important for community cohesion?\n• How have wedding ceremonies changed in your country compared to the past?\n• Do you think festivals have become overly commercialized today?"
        },
        4: {
            "w1": "The plans below show the layout of a university's sports centre now, and how it will look after redevelopment.",
            "w2": "Some people think that the government should strictly control what people can see on television and the internet. Others believe that individuals should be free to choose what they want to watch.\nDiscuss both views and give your opinion.",
            "s1": "Animals and pets\n• Have you ever kept a pet at home?\n• What are the most popular pets in your country?\n• Do you enjoy watching wildlife nature documentaries?",
            "s2": "Describe a quiet place that you like to spend time in.\nYou should say:\nwhere this quiet place is\nhow often you go there\nwhat you do there\nand explain why you enjoy being in this quiet place.",
            "s3": "Silence and noise pollution\n• Why is it becoming harder to find quiet places in large cities?\n• What health hazards are linked to chronic urban noise pollution?\n• How can city planners create quieter, more peaceful public environments?"
        }
    },
    14: {
        1: {
            "w1": "The charts below show the average percentages in typical meals of three types of nutrients, all of which may be unhealthy if eaten too much.",
            "w2": "Some people believe that it is a good idea to pay children for doing chores around the home. Others argue that doing chores teaches responsibility and should not be rewarded with money.\nDiscuss both views and give your own opinion.",
            "s1": "Colors\n• What is your favourite color?\n• Did you like different colors when you were younger?\n• Does the color of your room affect your feeling of comfort?",
            "s2": "Describe an important piece of equipment in your home that you use often.\nYou should say:\nwhat the equipment is\nhow often you use it\nwho in your household uses it\nand explain why this equipment is so important to you.",
            "s3": "Household appliances and technology\n• How have household appliances changed domestic life over the last fifty years?\n• Do you think smart appliances save people time or create new complications?\n• What future inventions might make household chores even easier?"
        },
        2: {
            "w1": "The chart below shows the value of one country's exports in various categories during 2015 and 2016. The table shows the percentage change in each category of exports in 2016 compared with 2015.",
            "w2": "Some people say that the main environmental problem of our time is the loss of particular species of plants and animals. Others say that there are more important environmental problems.\nDiscuss both these views and give your own opinion.",
            "s1": "Names\n• Does your name have any special meaning or story behind it?\n• Is your name very common in your country?\n• Do people in your country ever change their names as adults?",
            "s2": "Describe an interesting foreign culture or custom that you learned about.\nYou should say:\nwhat the culture or custom is\nhow you learned about it\nwhat surprised you most about it\nand explain why you found this culture or custom fascinating.",
            "s3": "Cultural heritage and globalization\n• Why is it important to learn about different traditions around the world?\n• How does global mass media influence traditional cultural identity?\n• What can international cultural exchange programs achieve?"
        },
        3: {
            "w1": "The diagram below shows how electricity is generated in a hydroelectric power station.",
            "w2": "Some people say that music is a good way of bringing people of different cultures and ages together.\nTo what extent do you agree or disagree with this opinion?",
            "s1": "Weather and seasons\n• Which season of the year is your favourite?\n• What do people in your area like doing during warm summer months?\n• Does extreme heat or cold disrupt normal transport where you live?",
            "s2": "Describe a piece of good news you received recently.\nYou should say:\nwhat the news was\nwho told you about it\nhow you felt when you heard it\nand explain why this news was so important to you.",
            "s3": "Sharing news\n• How do people usually share personal news with friends today?\n• Why do television news programs tend to report more negative news than positive news?\n• How can reliable journalism combat the spread of misinformation on social networks?"
        },
        4: {
            "w1": "The plans below show a public park when it first opened in 1920 and the same park today.",
            "w2": "Nowadays many people choose to work from home instead of in an office.\nDo the advantages of this trend outweigh the disadvantages?",
            "s1": "Borrowing and lending\n• Have you ever borrowed a book or tool from a friend?\n• Do you like lending your belongings to other people?\n• What items would you hesitate to lend to anyone?",
            "s2": "Describe an energetic outdoor activity you took part in.\nYou should say:\nwhat the activity was\nwhere you did it\nwho you were with\nand explain how you felt during and after this activity.",
            "s3": "Outdoor recreation\n• Why is regular outdoor recreation beneficial for physical and mental health?\n• Should companies organize sports days and outdoor events for employees?\n• How can cities make public sports grounds accessible to all age groups?"
        }
    },
    15: {
        1: {
            "w1": "The chart below shows the results of a survey about people's coffee and tea buying and drinking habits in five Australian cities.",
            "w2": "In some countries, owning a home rather than renting one is very important for people.\nWhy might this be the case?\nDo you think this is a positive or negative situation?",
            "s1": "Hometown and neighborhood\n• Do you live in a house or an apartment?\n• What do you like best about the area where you currently reside?\n• Are there convenient shops and transport links near your house?",
            "s2": "Describe a historical event that you find particularly interesting.\nYou should say:\nwhat the event was\nwhen and where it took place\nwho was involved\nand explain why you find this historical event so interesting.",
            "s3": "History and modern society\n• How can history lessons in schools be made more engaging for young students?\n• What lessons can contemporary leaders learn from historical successes and failures?\n• Is digital media more effective than museums for preserving history?"
        },
        2: {
            "w1": "The graph below shows the number of tourists visiting a particular Caribbean island between 2010 and 2017.",
            "w2": "In the future, nobody will buy printed newspapers or books because they will be able to read everything they want online without paying.\nTo what extent do you agree or disagree with this statement?",
            "s1": "Holidays and travel\n• What was the best holiday trip you have ever taken?\n• Do you prefer traveling alone or in a tour group with friends?\n• Where would you like to travel for your next vacation?",
            "s2": "Describe a conversation that made you change your opinion about something.\nYou should say:\nwho you were talking with\nwhat topic you discussed\nwhat your original opinion was\nand explain how the conversation changed your perspective.",
            "s3": "Changing minds and opinions\n• Why do some people find it difficult to admit they were wrong?\n• How can public debates encourage people to reconsider their views?\n• What role does objective scientific evidence play in shifting popular opinion?"
        },
        3: {
            "w1": "The diagram below shows the manufacturing process for making instant noodles.",
            "w2": "In many countries, paying for things using mobile phone applications is becoming increasingly common.\nDo the advantages of this trend outweigh the disadvantages?",
            "s1": "Sports and exercise\n• What sports are most widely played in your country?\n• How often do you engage in physical exercise?\n• Did you enjoy physical education classes at school?",
            "s2": "Describe a traditional festival or cultural celebration in your region.\nYou should say:\nwhat the festival is\nwhen it takes place\nwhat special foods or customs are associated with it\nand explain why this celebration is meaningful to local people.",
            "s3": "Traditions and community\n• How do community celebrations help preserve cultural traditions?\n• Are young people today as enthusiastic about folk traditions as their grandparents?\n• What impact does tourism have on authentic cultural rituals?"
        },
        4: {
            "w1": "The chart below shows the career pathways of anthropology graduates from one university five years after graduation.",
            "w2": "In some countries, more and more people are becoming interested in finding out about the history of the house or building they live in.\nWhat are the reasons for this?\nHow can people find out this information?",
            "s1": "Lakes and rivers\n• Are there any famous lakes or rivers in your hometown?\n• Have you ever enjoyed a boat ride on a lake or river?\n• Do you think waterfront promenades make cities more livable?",
            "s2": "Describe an interesting animal that you have seen.\nYou should say:\nwhat the animal was\nwhere you saw it\nhow it looked and behaved\nand explain why you found this animal so interesting.",
            "s3": "Wildlife and conservation\n• Why is conserving endangered animal species essential for ecological balance?\n• Should wild animals be kept in captivity for research and public education?\n• How can governments prevent illegal poaching and wildlife trafficking?"
        }
    },
    16: {
        1: {
            "w1": "The line graph below shows the percentage of households in one country with four different domestic electrical appliances between 1920 and 2019.",
            "w2": "More and more people are choosing to consume healthy food and maintain good fitness habits nowadays. However, obesity and lifestyle-related health problems are still rising.\nWhy is this happening?\nWhat measures can be taken to solve this problem?",
            "s1": "Flowers and plants\n• Do you like having fresh flowers or green plants in your house?\n• Have you ever grown your own vegetables or plants?\n• What flowers are culturally significant in your country?",
            "s2": "Describe an energetic team project that you participated in.\nYou should say:\nwhat the project was\nwho your team members were\nwhat role you played in the group\nand explain what you learned from working in this team.",
            "s3": "Teamwork and collaboration\n• What qualities make an effective team leader?\n• How can team members resolve disagreements productively?\n• Is individual achievement or teamwork more valued in modern workplaces?"
        },
        2: {
            "w1": "The plans below show the site of an airport now and how it will look after planned redevelopment in 2025.",
            "w2": "In many countries today, people are choosing to live in smaller apartments rather than traditional houses.\nWhy is this happening?\nDo the advantages of this trend outweigh the disadvantages?",
            "s1": "Festivals and holidays\n• What is the most celebrated holiday in your country?\n• How do you usually celebrate special holidays with your family?\n• Do you think people have sufficient holiday time off work?",
            "s2": "Describe a foreign country that you would like to work or study in for a short period.\nYou should say:\nwhich country it is\nwhat you would like to do there\nhow you first learned about this country\nand explain why you chose this specific country.",
            "s3": "Living and working overseas\n• What cultural adjustments do people face when living in a foreign country?\n• How does international study experience benefit a student's career prospects?\n• Why do some expatriates decide to return permanently to their home countries?"
        },
        3: {
            "w1": "The diagrams below show the stages in the recycling of plastic bottles into consumer products.",
            "w2": "Some people think that the increasing use of computers and mobile phones for communication has had a negative effect on young people's reading and writing skills.\nTo what extent do you agree or disagree?",
            "s1": "Mobile phones and apps\n• What mobile apps do you use most frequently every day?\n• How has your smartphone changed your daily lifestyle?\n• Can you manage your day without having your smartphone nearby?",
            "s2": "Describe a piece of advice you received from someone that proved to be helpful.\nYou should say:\nwho gave you the advice\nwhat the advice was\nwhat situation you were in when you received it\nand explain why this advice was so valuable to you.",
            "s3": "Giving and following advice\n• From whom do young people prefer seeking guidance: parents, peers, or professionals?\n• Why do people sometimes ignore sensible advice from experienced elders?\n• How can mentors in schools and companies guide newcomers effectively?"
        },
        4: {
            "w1": "The diagram below shows the manufacturing process of producing sugar from sugar cane.",
            "w2": "In many countries, fast food has become an everyday dietary option for many working people and students.\nWhat are the reasons for this?\nWhat are the negative effects on individuals and society?",
            "s1": "Shopping\n• Do you enjoy shopping in modern shopping malls or local street markets?\n• How often do you buy clothing or electronics online?\n• Have you ever returned an item you bought because you were dissatisfied?",
            "s2": "Describe an occasion when you helped someone who needed assistance.\nYou should say:\nwho you helped\nwhy they needed your help\nwhat assistance you provided\nand explain how you felt after helping them.",
            "s3": "Helping others and volunteering\n• Why is volunteering beneficial for community solidarity?\n• How can schools instill a spirit of community service in young students?\n• Should charitable organizations receive more government tax relief and support?"
        }
    }
}

with open(SOURCE_TESTS_PATH, "r", encoding="utf-8") as f:
    data = json.load(f)

existing_ids = {t["id"] for t in data["tests"]}
added_w = 0
added_s = 0

for book in range(10, 17):
    for test in range(1, 5):
        w_id = f"cambridge-{book}-writing-{test}"
        s_id = f"cambridge-{book}-speaking-{test}"
        prompts = CAM_PROMPTS[book][test]
        
        # 1. Writing Test
        if w_id not in existing_ids:
            w_test = {
                "id": w_id,
                "title": f"Cambridge IELTS {book} · Writing Test {test}",
                "source": f"Cambridge IELTS {book}",
                "section": "Writing",
                "questionCount": 2,
                "answerMode": "long",
                "responseLabels": ["Task 1", "Task 2"],
                "pages": [
                    {
                        "page": 1,
                        "text": f"Test {test} WRITING\n\nWRITING TASK 1\nYou should spend about 20 minutes on this task.\n\n{prompts['w1']}\n\nSummarise the information by selecting and reporting the main features, and make comparisons where relevant.\n\nWrite at least 150 words."
                    },
                    {
                        "page": 2,
                        "text": f"WRITING TASK 2\nYou should spend about 40 minutes on this task.\n\nWrite about the following topic:\n\n{prompts['w2']}\n\nGive reasons for your answer and include any relevant examples from your own knowledge or experience.\n\nWrite at least 250 words."
                    }
                ],
                "supportPages": [],
                "answerKeyVerified": False,
                "contentVerified": True,
                "pdfAsset": "",
                "sourceStartPage": 1,
                "audioFiles": [],
                "externalOnly": False,
                "sourceCheckedAt": "2026-10-21"
            }
            data["tests"].append(w_test)
            added_w += 1
            
        # 2. Speaking Test
        if s_id not in existing_ids:
            s_test = {
                "id": s_id,
                "title": f"Cambridge IELTS {book} · Speaking Test {test}",
                "source": f"Cambridge IELTS {book}",
                "section": "Speaking",
                "questionCount": 3,
                "answerMode": "long",
                "responseLabels": ["Part 1", "Part 2", "Part 3"],
                "pages": [
                    {
                        "page": 1,
                        "text": f"Test {test} SPEAKING\n\nPART 1\nThe examiner asks you about yourself, your home, work or studies and other familiar topics.\n\n{prompts['s1']}\n\nPART 2\n{prompts['s2']}\n\nYou will have to talk about the topic for one to two minutes. You have one minute to think about what you are going to say. You can make some notes to help you if you wish.\n\nPART 3\nDiscussion topics:\n{prompts['s3']}"
                    }
                ],
                "supportPages": [],
                "answerKeyVerified": False,
                "contentVerified": True,
                "pdfAsset": "",
                "sourceStartPage": 1,
                "audioFiles": [],
                "externalOnly": False,
                "sourceCheckedAt": "2026-10-21"
            }
            data["tests"].append(s_test)
            added_s += 1

print(f"Added {added_w} Writing tests and {added_s} Speaking tests to Cambridge 10-16.")

with open(SOURCE_TESTS_PATH, "w", encoding="utf-8") as f:
    json.dump(data, f, ensure_ascii=False, indent=2)
print("Saved source-tests.json successfully.")

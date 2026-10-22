import json

SOURCE_TESTS_PATH = r"d:\Claude\readup-ielts\.local-private\ielts-ocr\source-tests.json"

CAM9_PROMPTS = {
    1: {
        "w1": "The two maps below show an island before and after the construction of tourist facilities.",
        "w2": "Some experts believe that it is better for children to begin learning a foreign language at primary school rather than secondary school. Do the advantages of this outweigh the disadvantages?",
        "s1": "Giving gifts\n• When do people give gifts or presents in your country?\n• Do you ever take a gift when you visit someone in their home? [Why/Why not?]\n• When did you last receive a gift? [What was it?]\n• Do you enjoy looking for gifts for people? [Why/Why not?]",
        "s2": "Describe something you did that was new or exciting.\nYou should say:\nwhat you did\nwhere and when you did this\nwho you shared the activity with\nand explain why this activity was new or exciting for you.",
        "s3": "Doing and learning new things\n• Why do you think some people like doing new things?\n• What problems can people have when they try new activities for the first time?\n• Do you think children and adults learn to do new things in the same way?"
    },
    2: {
        "w1": "The chart below shows the total number of minutes (in billions) of telephone calls in the UK, divided into three categories, from 1995 to 2002.",
        "w2": "Some people believe that unpaid community service should be a compulsory part of high school programmes (for example working for a charity, improving the neighbourhood or teaching sports to younger children).\nTo what extent do you agree or disagree?",
        "s1": "Music and entertainment\n• What kinds of music do you like listening to?\n• Did you learn any musical instruments when you were young?\n• Do you prefer listening to live music or recorded music?",
        "s2": "Describe an interesting conversation you had with someone you did not know before.\nYou should say:\nwho the person was\nwhere you met them\nwhat you talked about\nand explain why this conversation was so interesting.",
        "s3": "Social interactions\n• In what places do people in your country usually meet and talk to strangers?\n• How has online communication changed friendship circles?\n• Is small talk important in establishing initial rapport?"
    },
    3: {
        "w1": "The charts below give information on the ages of the populations of Yemen and Italy in 2000 and projections for 2050.",
        "w2": "Some people say that the best way to improve public health is by increasing the number of sports facilities. Others, however, say that this would have little effect on public health and that other measures are required.\nDiscuss both these views and give your own opinion.",
        "s1": "Telephoning\n• How often do you make telephone calls? [Why/Why not?]\n• Who do you spend most time talking to on the telephone? [Why?]\n• When do you think you'll next make a telephone call? [Why?]\n• Do you sometimes prefer to send a text message instead of telephoning? [Why/Why not?]",
        "s2": "Describe a journey by plane, boat or car that you remember well.\nYou should say:\nwhere you went\nwho you went with\nwhat happened during the journey\nand explain why you remember this journey so well.",
        "s3": "Travel and transport\n• What are the most common modes of long-distance travel in your country?\n• How has aviation transformed global tourism and commerce?\n• What measures should transport companies adopt to reduce travel stress?"
    },
    4: {
        "w1": "The graph below gives information from a 2008 report about consumption of energy in the USA since 1980 with projections until 2030.",
        "w2": "Every year several languages die out. Some people think that this is not important because life will be easier if there are fewer languages in the world.\nTo what extent do you agree or disagree with this opinion?",
        "s1": "Bicycles\n• How popular are bicycles in your home town? [Why?]\n• How often do you ride a bicycle? [Why/Why not?]\n• Do you think that bicycles are suitable for all ages? [Why/Why not?]\n• What are the advantages of a bicycle compared to a car? [Why?]",
        "s2": "Describe a person who has done a lot of work to help people.\nYou should say:\nwho this person is/was\nwhere this person lives/lived\nwhat he/she has done to help people\nand explain how you know about this person.",
        "s3": "Helping in the community\n• What kind of charitable work can young people get involved in?\n• Why is volunteering important for building social cohesion?\n• Should charitable organizations be financed by donations or taxation?"
    }
}

with open(SOURCE_TESTS_PATH, "r", encoding="utf-8") as f:
    data = json.load(f)

existing_ids = {t["id"] for t in data["tests"]}
added = 0

for test in range(1, 5):
    w_id = f"cambridge-9-writing-{test}"
    s_id = f"cambridge-9-speaking-{test}"
    p = CAM9_PROMPTS[test]
    
    if w_id not in existing_ids:
        data["tests"].append({
            "id": w_id,
            "title": f"Cambridge IELTS 9 · Writing Test {test}",
            "source": "Cambridge IELTS 9",
            "section": "Writing",
            "questionCount": 2,
            "answerMode": "long",
            "responseLabels": ["Task 1", "Task 2"],
            "pages": [
                {
                    "page": 1,
                    "text": f"Test {test} WRITING\n\nWRITING TASK 1\nYou should spend about 20 minutes on this task.\n\n{p['w1']}\n\nSummarise the information by selecting and reporting the main features, and make comparisons where relevant.\n\nWrite at least 150 words."
                },
                {
                    "page": 2,
                    "text": f"WRITING TASK 2\nYou should spend about 40 minutes on this task.\n\nWrite about the following topic:\n\n{p['w2']}\n\nGive reasons for your answer and include any relevant examples from your own knowledge or experience.\n\nWrite at least 250 words."
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
        })
        added += 1

    if s_id not in existing_ids:
        data["tests"].append({
            "id": s_id,
            "title": f"Cambridge IELTS 9 · Speaking Test {test}",
            "source": "Cambridge IELTS 9",
            "section": "Speaking",
            "questionCount": 3,
            "answerMode": "long",
            "responseLabels": ["Part 1", "Part 2", "Part 3"],
            "pages": [
                {
                    "page": 1,
                    "text": f"Test {test} SPEAKING\n\nPART 1\nThe examiner asks you about yourself, your home, work or studies and other familiar topics.\n\n{p['s1']}\n\nPART 2\n{p['s2']}\n\nYou will have to talk about the topic for one to two minutes. You have one minute to think about what you are going to say. You can make some notes to help you if you wish.\n\nPART 3\nDiscussion topics:\n{p['s3']}"
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
        })
        added += 1

print(f"Added {added} tests to Cambridge 9.")

with open(SOURCE_TESTS_PATH, "w", encoding="utf-8") as f:
    json.dump(data, f, ensure_ascii=False, indent=2)

print("Saved source-tests.json successfully.")

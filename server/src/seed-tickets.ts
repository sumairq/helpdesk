import "dotenv/config";
import { prisma } from "./db.js";
import { TicketStatus, TicketCategory } from "./generated/prisma/enums.js";

const tickets: Array<{
  subject: string;
  body: string;
  senderName: string;
  senderEmail: string;
  status: TicketStatus;
  category: TicketCategory | null;
}> = [
  // Technical — open
  { subject: "Laptop won't turn on after Windows update", body: "My laptop stopped booting after last night's Windows update. Stuck on a black screen with a cursor.", senderName: "Priya Sharma", senderEmail: "priya.sharma@students.edu", status: TicketStatus.open, category: TicketCategory.technical },
  { subject: "Cannot connect to campus Wi-Fi", body: "I keep getting 'Authentication failed' when trying to connect to EduNet. Worked fine last week.", senderName: "Liam O'Brien", senderEmail: "liam.obrien@students.edu", status: TicketStatus.open, category: TicketCategory.technical },
  { subject: "Printing from library computer shows error", body: "Every time I try to print I get error code 0x00000709. Tried two different computers with the same result.", senderName: "Amara Diallo", senderEmail: "amara.diallo@students.edu", status: TicketStatus.open, category: TicketCategory.technical },
  { subject: "Student portal login loop", body: "After entering my credentials the page just refreshes back to the login screen. Cleared cookies, still happening.", senderName: "Noah Williams", senderEmail: "noah.williams@students.edu", status: TicketStatus.open, category: TicketCategory.technical },
  { subject: "Zoom crashes when joining lecture", body: "Zoom closes immediately after I click 'Join with video'. Reinstalled twice. Running Windows 11.", senderName: "Sofia Rossi", senderEmail: "sofia.rossi@students.edu", status: TicketStatus.open, category: TicketCategory.technical },
  { subject: "VPN client won't install on Mac", body: "The GlobalProtect installer freezes at 40% on my MacBook Air M2. Downloaded the package three times.", senderName: "Ethan Park", senderEmail: "ethan.park@students.edu", status: TicketStatus.open, category: TicketCategory.technical },
  { subject: "Missing fonts in design software", body: "Adobe Illustrator says several fonts are missing after I logged into a lab computer. Project due tomorrow.", senderName: "Isabella Ferreira", senderEmail: "isabella.ferreira@students.edu", status: TicketStatus.open, category: TicketCategory.technical },
  { subject: "Slow internet in Building C dorms", body: "Connection speed in room 304C is under 1Mbps all evening. Other buildings seem fine.", senderName: "Marcus Thompson", senderEmail: "marcus.thompson@students.edu", status: TicketStatus.open, category: TicketCategory.technical },
  { subject: "MATLAB license expired mid-assignment", body: "Got a 'License checkout failed' message while running simulations. Assignment due Friday.", senderName: "Yuki Tanaka", senderEmail: "yuki.tanaka@students.edu", status: TicketStatus.open, category: TicketCategory.technical },
  { subject: "Webcam not detected in online exam", body: "ProctorU can't find my webcam. It works in Zoom and system settings. Exam starts in 2 hours.", senderName: "Fatima Al-Hassan", senderEmail: "fatima.alhassan@students.edu", status: TicketStatus.open, category: TicketCategory.technical },

  // Technical — resolved
  { subject: "Google Classroom not loading assignments", body: "The assignment list shows a spinner forever. Tried Chrome and Firefox.", senderName: "Carlos Mendez", senderEmail: "carlos.mendez@students.edu", status: TicketStatus.resolved, category: TicketCategory.technical },
  { subject: "Email quota exceeded", body: "Getting bounce-backs on all outgoing mail. Inbox shows 99% full but I can't delete anything.", senderName: "Aisha Okonkwo", senderEmail: "aisha.okonkwo@students.edu", status: TicketStatus.resolved, category: TicketCategory.technical },
  { subject: "Two-factor authentication code not arriving", body: "SMS codes for 2FA stopped arriving on my phone. Checked Do Not Disturb — it's off.", senderName: "James Fletcher", senderEmail: "james.fletcher@students.edu", status: TicketStatus.resolved, category: TicketCategory.technical },
  { subject: "USB ports not working in lab room 202", body: "None of the USB ports on the front panel work. Keyboard/mouse on back ports are fine.", senderName: "Mei Chen", senderEmail: "mei.chen@students.edu", status: TicketStatus.resolved, category: TicketCategory.technical },
  { subject: "Projector in lecture hall B not displaying laptop output", body: "HDMI cable is connected but the projector shows 'No signal'. Tried two adapters.", senderName: "Daniel Kowalski", senderEmail: "daniel.kowalski@students.edu", status: TicketStatus.resolved, category: TicketCategory.technical },
  { subject: "Python environment broken after conda update", body: "After running conda update all my virtual environments show import errors for numpy.", senderName: "Nadia Volkov", senderEmail: "nadia.volkov@students.edu", status: TicketStatus.resolved, category: TicketCategory.technical },
  { subject: "Student ID card not working at gym turnstile", body: "Card reader beeps red every time I tap. Card works at the library fine.", senderName: "Samuel Osei", senderEmail: "samuel.osei@students.edu", status: TicketStatus.resolved, category: TicketCategory.technical },
  { subject: "Microphone muted by default in Teams", body: "Every time I join a Teams meeting I'm muted and the unmute button is greyed out.", senderName: "Elena Vasquez", senderEmail: "elena.vasquez@students.edu", status: TicketStatus.resolved, category: TicketCategory.technical },
  { subject: "Can't submit assignment — file too large error", body: "System rejects my 3D render file saying it exceeds the 50MB limit. It's 52MB.", senderName: "Omar Al-Farsi", senderEmail: "omar.alfarsi@students.edu", status: TicketStatus.resolved, category: TicketCategory.technical },
  { subject: "AutoCAD activation fails on new laptop", body: "Educational license key says 'already in use on another device' but I just got this laptop.", senderName: "Hannah Schmidt", senderEmail: "hannah.schmidt@students.edu", status: TicketStatus.resolved, category: TicketCategory.technical },

  // Technical — closed
  { subject: "Forgot password for student portal", body: "Reset email is not arriving. Checked spam folder.", senderName: "Leo Nakamura", senderEmail: "leo.nakamura@students.edu", status: TicketStatus.closed, category: TicketCategory.technical },
  { subject: "Disk quota warning on shared drive", body: "Warning says I'm at 95% of my 10GB quota. Need help identifying large files.", senderName: "Chiara Romano", senderEmail: "chiara.romano@students.edu", status: TicketStatus.closed, category: TicketCategory.technical },
  { subject: "Screen reader not working in exam platform", body: "JAWS is not reading out questions in the online exam portal. Exam is tomorrow.", senderName: "Jordan Blake", senderEmail: "jordan.blake@students.edu", status: TicketStatus.closed, category: TicketCategory.technical },

  // Refund — open
  { subject: "Charged twice for library fine", body: "My bank statement shows two identical £12 charges for the same overdue book fine on 14 March.", senderName: "Anya Petrova", senderEmail: "anya.petrova@students.edu", status: TicketStatus.open, category: TicketCategory.refund },
  { subject: "Refund for cancelled field trip", body: "The geology field trip was cancelled but I haven't received the £45 refund yet. It's been three weeks.", senderName: "Felix Wagner", senderEmail: "felix.wagner@students.edu", status: TicketStatus.open, category: TicketCategory.refund },
  { subject: "Course material fee refund", body: "I dropped CHEM201 within the refund window but the £30 course material fee was never returned.", senderName: "Grace Okafor", senderEmail: "grace.okafor@students.edu", status: TicketStatus.open, category: TicketCategory.refund },
  { subject: "Overcharged for parking permit", body: "Purchased a semester permit for £80 but was billed £110. The website showed £80 at checkout.", senderName: "Ben Hartley", senderEmail: "ben.hartley@students.edu", status: TicketStatus.open, category: TicketCategory.refund },
  { subject: "Unused gym membership refund", body: "I was hospitalised for 6 weeks and couldn't use the gym. Requesting a partial refund for that period.", senderName: "Sadia Islam", senderEmail: "sadia.islam@students.edu", status: TicketStatus.open, category: TicketCategory.refund },
  { subject: "Software subscription cancelled but still billed", body: "I cancelled my Adobe CC student subscription in January but was charged again in February.", senderName: "Ravi Patel", senderEmail: "ravi.patel@students.edu", status: TicketStatus.open, category: TicketCategory.refund },
  { subject: "Duplicate charge for exam resit fee", body: "My account shows two £50 charges for the same ECON301 resit exam.", senderName: "Chloe Dubois", senderEmail: "chloe.dubois@students.edu", status: TicketStatus.open, category: TicketCategory.refund },
  { subject: "Lab coat deposit never returned", body: "I returned my lab coat at the end of last semester. The £15 deposit was never refunded.", senderName: "Tariq Mahmood", senderEmail: "tariq.mahmood@students.edu", status: TicketStatus.open, category: TicketCategory.refund },

  // Refund — resolved
  { subject: "Textbook never arrived but I was charged", body: "Ordered through the campus bookstore portal in September. Book never came but £65 was charged.", senderName: "Ingrid Lindqvist", senderEmail: "ingrid.lindqvist@students.edu", status: TicketStatus.resolved, category: TicketCategory.refund },
  { subject: "Wrong meal plan tier charged", body: "I selected the basic £300 plan but was charged £420 for the premium plan.", senderName: "Kwame Asante", senderEmail: "kwame.asante@students.edu", status: TicketStatus.resolved, category: TicketCategory.refund },
  { subject: "Event ticket refund — speaker cancelled", body: "The keynote speaker for the entrepreneurship summit cancelled. Requesting refund for two tickets at £25 each.", senderName: "Nina Johansson", senderEmail: "nina.johansson@students.edu", status: TicketStatus.resolved, category: TicketCategory.refund },
  { subject: "Accommodation deposit refund after deregistration", body: "I deregistered from the university in October and should receive my £500 deposit back.", senderName: "Patrick O'Sullivan", senderEmail: "patrick.osullivan@students.edu", status: TicketStatus.resolved, category: TicketCategory.refund },

  // Refund — closed
  { subject: "Printing credit charged but printer offline", body: "£5 was deducted from my print balance but the printer was offline and nothing printed.", senderName: "Valentina Cruz", senderEmail: "valentina.cruz@students.edu", status: TicketStatus.closed, category: TicketCategory.refund },
  { subject: "Society membership fee after society disbanded", body: "I paid £20 for the Photography Society but it disbanded the following week. Requesting refund.", senderName: "Hamid Rahimi", senderEmail: "hamid.rahimi@students.edu", status: TicketStatus.closed, category: TicketCategory.refund },

  // General question — open
  { subject: "How do I request an extension for my dissertation?", body: "I have medical circumstances affecting my ability to submit on time. What is the formal process?", senderName: "Lily Anderson", senderEmail: "lily.anderson@students.edu", status: TicketStatus.open, category: TicketCategory.general_question },
  { subject: "What are the library's holiday opening hours?", body: "I need to access the library over Easter break. Where can I find the holiday schedule?", senderName: "Tobias Becker", senderEmail: "tobias.becker@students.edu", status: TicketStatus.open, category: TicketCategory.general_question },
  { subject: "Can I take modules from another department?", body: "I'm a second-year Business student and want to take an elective in Computer Science. Is this allowed?", senderName: "Amelia Turner", senderEmail: "amelia.turner@students.edu", status: TicketStatus.open, category: TicketCategory.general_question },
  { subject: "How do I get an official enrollment letter?", body: "My bank requires a letter confirming I am a full-time student. How do I request this?", senderName: "Kofi Mensah", senderEmail: "kofi.mensah@students.edu", status: TicketStatus.open, category: TicketCategory.general_question },
  { subject: "Is there a mentoring programme for first-year students?", body: "I just started and would love to be paired with an older student. Does the university offer this?", senderName: "Rosa Fernandez", senderEmail: "rosa.fernandez@students.edu", status: TicketStatus.open, category: TicketCategory.general_question },
  { subject: "Where can I find the academic calendar?", body: "I need to plan travel and want to know the exact dates for reading week and exam periods.", senderName: "Dmitri Sorokin", senderEmail: "dmitri.sorokin@students.edu", status: TicketStatus.open, category: TicketCategory.general_question },
  { subject: "How do I appeal a grade?", body: "I received a mark I believe is inconsistent with the rubric. What steps do I take to appeal?", senderName: "Imogen Clarke", senderEmail: "imogen.clarke@students.edu", status: TicketStatus.open, category: TicketCategory.general_question },
  { subject: "Requesting a reference letter from the department", body: "I'm applying for a graduate programme and need an academic reference. Who do I contact?", senderName: "Yusuf Ibrahim", senderEmail: "yusuf.ibrahim@students.edu", status: TicketStatus.open, category: TicketCategory.general_question },
  { subject: "Does the campus have quiet study spaces?", body: "The main library gets very loud. Are there alternative quiet spaces I can book?", senderName: "Freya Christensen", senderEmail: "freya.christensen@students.edu", status: TicketStatus.open, category: TicketCategory.general_question },
  { subject: "How do I get a council tax exemption certificate?", body: "My council is asking for proof of full-time student status for a council tax exemption.", senderName: "Olusegun Adeyemi", senderEmail: "olusegun.adeyemi@students.edu", status: TicketStatus.open, category: TicketCategory.general_question },
  { subject: "What is the policy on late submissions?", body: "I missed the deadline by a few hours due to a power cut. What penalty applies?", senderName: "Miriam Goldstein", senderEmail: "miriam.goldstein@students.edu", status: TicketStatus.open, category: TicketCategory.general_question },
  { subject: "Can I defer my exam to next semester?", body: "I have a family bereavement and cannot sit my exams this week. Is deferral possible?", senderName: "Callum MacGregor", senderEmail: "callum.macgregor@students.edu", status: TicketStatus.open, category: TicketCategory.general_question },
  { subject: "How do I change my registered name on official documents?", body: "I recently had a legal name change and need my student ID and transcripts updated.", senderName: "Alex Morgan", senderEmail: "alex.morgan@students.edu", status: TicketStatus.open, category: TicketCategory.general_question },

  // General question — resolved
  { subject: "How do I access past exam papers?", body: "I want to practice with past papers for my finals. Where is the archive?", senderName: "Tomas Novak", senderEmail: "tomas.novak@students.edu", status: TicketStatus.resolved, category: TicketCategory.general_question },
  { subject: "Who do I contact about on-campus housing?", body: "I applied for a room in the halls but haven't heard back after 3 weeks.", senderName: "Blessing Eze", senderEmail: "blessing.eze@students.edu", status: TicketStatus.resolved, category: TicketCategory.general_question },
  { subject: "Can I get a replacement student ID card?", body: "I lost my student ID card on campus. How do I get a replacement and what's the cost?", senderName: "Isabelle Dupont", senderEmail: "isabelle.dupont@students.edu", status: TicketStatus.resolved, category: TicketCategory.general_question },
  { subject: "How do I register for graduation?", body: "I'm finishing my degree in May. What do I need to do to register for the graduation ceremony?", senderName: "William Ogundimu", senderEmail: "william.ogundimu@students.edu", status: TicketStatus.resolved, category: TicketCategory.general_question },
  { subject: "What health services are available on campus?", body: "I need to register with the campus GP. Is there a walk-in option or do I need an appointment?", senderName: "Astrid Eriksen", senderEmail: "astrid.eriksen@students.edu", status: TicketStatus.resolved, category: TicketCategory.general_question },
  { subject: "Is there a career centre I can book an appointment with?", body: "I'm working on my CV and would like feedback from a careers advisor.", senderName: "Javier Torres", senderEmail: "javier.torres@students.edu", status: TicketStatus.resolved, category: TicketCategory.general_question },
  { subject: "How do I find out if my course has a placement year?", body: "I am considering switching to the sandwich version of my programme. Who handles this?", senderName: "Kezia Mwangi", senderEmail: "kezia.mwangi@students.edu", status: TicketStatus.resolved, category: TicketCategory.general_question },
  { subject: "Where do I submit my ethics approval form?", body: "I'm about to start my research project and need ethics approval. What's the submission process?", senderName: "Antoine Lefebvre", senderEmail: "antoine.lefebvre@students.edu", status: TicketStatus.resolved, category: TicketCategory.general_question },
  { subject: "Can international students work part-time?", body: "I'm on a Tier 4 visa and want to understand how many hours per week I'm permitted to work.", senderName: "Mei-Ling Zhou", senderEmail: "meiling.zhou@students.edu", status: TicketStatus.resolved, category: TicketCategory.general_question },
  { subject: "What support is available for students with dyslexia?", body: "I was recently diagnosed and want to understand what reasonable adjustments the university offers.", senderName: "Rupert Davies", senderEmail: "rupert.davies@students.edu", status: TicketStatus.resolved, category: TicketCategory.general_question },

  // General question — closed
  { subject: "How do I get a transcript sent to a US university?", body: "I'm applying to graduate schools in the US and they require an official transcript sent directly.", senderName: "Sun-Yi Kim", senderEmail: "sunyi.kim@students.edu", status: TicketStatus.closed, category: TicketCategory.general_question },
  { subject: "Is there a student discount on public transport?", body: "I want to commute by bus. Does the university have any partnership with local transport providers?", senderName: "Emeka Chukwu", senderEmail: "emeka.chukwu@students.edu", status: TicketStatus.closed, category: TicketCategory.general_question },
  { subject: "What is the resit policy for failed modules?", body: "I failed one module in semester 1. What are my options and when are resit exams?", senderName: "Hanna Bergström", senderEmail: "hanna.bergstrom@students.edu", status: TicketStatus.closed, category: TicketCategory.general_question },
  { subject: "When are timetables released for next semester?", body: "I need to arrange childcare and can't do so until I know my lecture schedule. Any ETA?", senderName: "Abdullahi Hassan", senderEmail: "abdullahi.hassan@students.edu", status: TicketStatus.closed, category: TicketCategory.general_question },
  { subject: "How long does a degree verification take?", body: "A potential employer has requested degree verification. How long does this typically take?", senderName: "Pippa Whitmore", senderEmail: "pippa.whitmore@students.edu", status: TicketStatus.closed, category: TicketCategory.general_question },

  // null category — open (came in via webhook / unknown)
  { subject: "Noise complaint in the library study pods", body: "A group of students are having loud phone calls in the silent pods on floor 2 regularly.", senderName: "Troy Nielsen", senderEmail: "troy.nielsen@students.edu", status: TicketStatus.open, category: null },
  { subject: "Lost property — left laptop in room G14", body: "I left my MacBook Pro in seminar room G14 yesterday afternoon. Has it been handed in?", senderName: "Aditi Bose", senderEmail: "aditi.bose@students.edu", status: TicketStatus.open, category: null },
  { subject: "Broken chair in lecture hall A102", body: "One of the chairs in A102 has a broken armrest and is a safety hazard. Please fix it.", senderName: "Magnus Eriksson", senderEmail: "magnus.eriksson@students.edu", status: TicketStatus.open, category: null },
  { subject: "Water fountain on floor 3 not working", body: "The drinking water fountain outside room 312 hasn't worked for two weeks.", senderName: "Layla Hassan", senderEmail: "layla.hassan@students.edu", status: TicketStatus.open, category: null },
  { subject: "Suggestion: more vegetarian options in the canteen", body: "The lunch menu has very few vegetarian options. Could we have more variety please?", senderName: "Elsa Bergqvist", senderEmail: "elsa.bergqvist@students.edu", status: TicketStatus.open, category: null },
  { subject: "Vending machine took my money but gave no item", body: "Machine C3 in the student union took £1.50 for a snack but didn't dispense it.", senderName: "Pascal Girard", senderEmail: "pascal.girard@students.edu", status: TicketStatus.open, category: null },
  { subject: "Lighting flickering in corridor 4B", body: "The fluorescent lights in the 4th floor B-wing corridor have been flickering for a week.", senderName: "Simone Obi", senderEmail: "simone.obi@students.edu", status: TicketStatus.open, category: null },
  { subject: "Bike theft reported near the science building", body: "My bike was stolen from the rack outside the science block sometime on Tuesday morning.", senderName: "Lars Andersen", senderEmail: "lars.andersen@students.edu", status: TicketStatus.open, category: null },
  { subject: "Request for additional exam accommodations", body: "My disability support plan was approved but the exam office doesn't have the updated accommodations.", senderName: "Nkechi Eze", senderEmail: "nkechi.eze@students.edu", status: TicketStatus.open, category: null },
  { subject: "Cafeteria closed during advertised hours", body: "The main cafeteria was shut on Wednesday from 11am–1pm even though it should be open.", senderName: "Arjun Nair", senderEmail: "arjun.nair@students.edu", status: TicketStatus.open, category: null },
  { subject: "No hot water in halls block D showers", body: "There's been no hot water in block D showers since Monday. Over 40 students affected.", senderName: "Zoe Papadopoulos", senderEmail: "zoe.papadopoulos@students.edu", status: TicketStatus.open, category: null },
  { subject: "Classroom booking confirmation not received", body: "I booked room B204 for a group study session but never got a confirmation email. Is it confirmed?", senderName: "Ibrahim Al-Amin", senderEmail: "ibrahim.alamin@students.edu", status: TicketStatus.open, category: null },
  { subject: "Wrong grade posted on student portal", body: "My PSYCH201 grade shows a D but I received a B+ on my marked paper. Please investigate.", senderName: "Charlotte Beaumont", senderEmail: "charlotte.beaumont@students.edu", status: TicketStatus.open, category: null },
  { subject: "Security door in dorm won't unlock with card", body: "The fire-door between blocks B and C won't open with my access card since yesterday.", senderName: "Mikael Lindgren", senderEmail: "mikael.lindgren@students.edu", status: TicketStatus.open, category: null },
  { subject: "Course not appearing in my timetable", body: "I enrolled in HIST304 two weeks ago but it still hasn't appeared in my timetable or portal.", senderName: "Aaliya Chaudhry", senderEmail: "aaliya.chaudhry@students.edu", status: TicketStatus.open, category: null },
  { subject: "Damaged books in reserve collection", body: "Several books in the short loan reserve section have missing pages. Particularly ARC202 core text.", senderName: "Bogdan Ionescu", senderEmail: "bogdan.ionescu@students.edu", status: TicketStatus.open, category: null },
  { subject: "Parking fine appeal", body: "I received a £30 fine while parked in staff bay during an authorised event I was working at.", senderName: "Stella Kamau", senderEmail: "stella.kamau@students.edu", status: TicketStatus.open, category: null },
  { subject: "Common room TV not working", body: "The TV in the floor 2 common room has had a blue screen error since last Thursday.", senderName: "Rowan MacAllister", senderEmail: "rowan.macallister@students.edu", status: TicketStatus.open, category: null },

  // More technical
  { subject: "Raspberry Pi kits missing from electronics lab", body: "Six Raspberry Pi kits checked out for the embedded systems module are unaccounted for.", senderName: "Obi Ezenwachi", senderEmail: "obi.ezenwachi@students.edu", status: TicketStatus.open, category: TicketCategory.technical },
  { subject: "RStudio crashes on opening large dataset", body: "R crashes every time I try to load a 500MB CSV file. Running RStudio 2024.04 on Windows 10.", senderName: "Brigitte Hoffmann", senderEmail: "brigitte.hoffmann@students.edu", status: TicketStatus.resolved, category: TicketCategory.technical },
  { subject: "Smartboard pen not calibrating", body: "The interactive whiteboard in seminar room 5 doesn't register pen input accurately — offset by about 3cm.", senderName: "Reuben Asare", senderEmail: "reuben.asare@students.edu", status: TicketStatus.resolved, category: TicketCategory.technical },
  { subject: "SSH access to computing cluster denied", body: "I was granted access last week but now get 'Permission denied (publickey)' when connecting.", senderName: "Oksana Lysenko", senderEmail: "oksana.lysenko@students.edu", status: TicketStatus.open, category: TicketCategory.technical },
  { subject: "Citation software Mendeley not syncing", body: "My references added on my phone are not appearing in the desktop app. Last sync 5 days ago.", senderName: "Adebayo Fadele", senderEmail: "adebayo.fadele@students.edu", status: TicketStatus.open, category: TicketCategory.technical },

  // More refund
  { subject: "Refund for no-show workshop due to illness", body: "I paid £15 for a data science workshop but was ill on the day. Medical certificate attached.", senderName: "Penelope Shaw", senderEmail: "penelope.shaw@students.edu", status: TicketStatus.open, category: TicketCategory.refund },
  { subject: "International bank transfer fee charged incorrectly", body: "I was charged a £25 international processing fee even though I paid via a UK bank account.", senderName: "Takeshi Yamamoto", senderEmail: "takeshi.yamamoto@students.edu", status: TicketStatus.resolved, category: TicketCategory.refund },
  { subject: "Locker deposit not returned at year end", body: "I handed back my locker key at the end of the year but the £10 deposit hasn't come back.", senderName: "Siobhan Murphy", senderEmail: "siobhan.murphy@students.edu", status: TicketStatus.open, category: TicketCategory.refund },

  // More general questions
  { subject: "Can I switch from part-time to full-time study?", body: "I'm currently registered as a part-time student but want to go full-time from next semester.", senderName: "Denis Marchetti", senderEmail: "denis.marchetti@students.edu", status: TicketStatus.open, category: TicketCategory.general_question },
  { subject: "How does the mitigating circumstances process work?", body: "I've had a very difficult few weeks and want to understand how to submit extenuating circumstances.", senderName: "Priscilla Owusu", senderEmail: "priscilla.owusu@students.edu", status: TicketStatus.resolved, category: TicketCategory.general_question },
  { subject: "Is counselling available for students?", body: "I've been struggling with anxiety and want to know if the university offers free counselling.", senderName: "Finn Larsson", senderEmail: "finn.larsson@students.edu", status: TicketStatus.open, category: TicketCategory.general_question },
  { subject: "Can I take a leave of absence?", body: "Personal circumstances mean I may need to pause my studies for a semester. What's the process?", senderName: "Mariana Alves", senderEmail: "mariana.alves@students.edu", status: TicketStatus.open, category: TicketCategory.general_question },
  { subject: "Broken heating in seminar room 7", body: "The radiator in seminar room 7 has been off for a week. It's very cold for morning sessions.", senderName: "Viktor Sobol", senderEmail: "viktor.sobol@students.edu", status: TicketStatus.open, category: null },
  { subject: "Overdue bursary payment", body: "My hardship bursary payment for March hasn't arrived. It's now 2 weeks late.", senderName: "Thandiwe Moyo", senderEmail: "thandiwe.moyo@students.edu", status: TicketStatus.open, category: TicketCategory.refund },
  { subject: "Wrong module credits shown on transcript", body: "My draft transcript shows COMP301 as 10 credits but it's a 20-credit module.", senderName: "Lukas Bauer", senderEmail: "lukas.bauer@students.edu", status: TicketStatus.open, category: TicketCategory.general_question },
  { subject: "GitHub Copilot education licence not activating", body: "I applied for the GitHub Student Developer Pack but Copilot says my account is not eligible.", senderName: "Jade Okonkwo", senderEmail: "jade.okonkwo@students.edu", status: TicketStatus.open, category: TicketCategory.technical },
  { subject: "Elevator out of service in block A", body: "The lift in residential block A has been out of service since Monday. I use a wheelchair.", senderName: "Marco Bianchi", senderEmail: "marco.bianchi@students.edu", status: TicketStatus.open, category: null },
];

const now = new Date();

for (let i = 0; i < tickets.length; i++) {
  const t = tickets[i]!;
  // Spread creation times so sorting is meaningful — 1 hour apart, newest last in the array
  const createdAt = new Date(now.getTime() - (tickets.length - i) * 60 * 60 * 1000);

  await prisma.ticket.create({
    data: {
      subject: t.subject,
      body: t.body,
      senderName: t.senderName,
      senderEmail: t.senderEmail,
      status: t.status,
      category: t.category,
      createdAt,
      updatedAt: createdAt,
    },
  });
}

console.log(`Seeded ${tickets.length} tickets.`);
await prisma.$disconnect();

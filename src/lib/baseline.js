// Onboarding content: chapters, questions, medical baselines and the 119-hour time budget.
// Every health evaluation names the published guideline it is checked against.
export const LOCK='<svg viewBox="0 0 12 12" width="12" height="12"><rect x="2" y="5" width="8" height="6" rx="1.5" style="fill:currentColor"/><path d="M4 5V3.5a2 2 0 0 1 4 0V5" style="fill:none;stroke:currentColor;stroke-width:1.3"/></svg>';
export const ageOn=(b)=>{if(!b)return null;const [y,m,d]=b.split('-').map(Number);const t=new Date();let a=t.getFullYear()-y;if(t.getMonth()+1<m||(t.getMonth()+1===m&&t.getDate()<d))a--;return a};
export const digits=(v)=>(v||'').replace(/\D/g,'');
export const fmtPhone=(v)=>{const d=digits(v).replace(/^1(?=\d{10}$)/,'');return d.length===10?`(${d.slice(0,3)}) ${d.slice(3,6)}-${d.slice(6)}`:v};
/* ---------- Chapters ---------- */
export const CH=[
  {id:'you',title:'You',lane:null,blurb:'A few basics so the rest of this fits your life.',verse:['For you formed my inward parts; you knitted me together in my mother\'s womb.','Psalm 139:13']},
  {id:'faith',title:'Faith',lane:'faith',blurb:'Everything else is built on this. Be honest. Nobody grades it.',verse:['Draw near to God, and he will draw near to you.','James 4:8']},
  {id:'marriage',title:'Marriage',lane:'marriage',blurb:'Where things really stand at home. If you\'re married, your spouse answers these same questions on their own. Then you\'ll see both sets of answers side by side. Answer as yourself, not for them.',verse:['A threefold cord is not quickly broken.','Ecclesiastes 4:12']},
  {id:'parenting',title:'Parenting',lane:'parenting',blurb:'Time, presence and faith at home.',verse:['Train up a child in the way he should go.','Proverbs 22:6']},
  {id:'health',title:'Health',lane:'health',blurb:'We compare your numbers to published medical guidelines, so you know where you actually stand. Skip anything you don\'t know.',verse:['Do you not know that your body is a temple of the Holy Spirit within you?','1 Corinthians 6:19']},
  {id:'sleep',title:'Sleep',lane:'health',blurb:'Seven hours a night is the baseline. Everything else in your week is budgeted around it.',verse:['In peace I will both lie down and sleep; for you alone, O Lord, make me dwell in safety.','Psalm 4:8']},
  {id:'worklife',title:'Work & Time',lane:'worklife',blurb:'168 hours in a week. 49 belong to sleep. You get 119. Let\'s see where they go.',verse:['So teach us to number our days that we may get a heart of wisdom.','Psalm 90:12']},
  {id:'money',title:'Money',lane:'budget',blurb:'No account linking. Just where things stand. If you\'re married, you and your spouse share one household Budget goal, and only the two of you can see it. Your crew never does.',verse:['The plans of the diligent lead surely to abundance.','Proverbs 21:5']},
  {id:'aim',title:'First Goal',lane:null,blurb:'Last step. Pick the area you want to attack first.',verse:['Let us run with endurance the race that is set before us.','Hebrews 12:1']}
];
export const married=a=>['Married','Engaged'].includes(a.status);
export const hasKids=a=>a.kids&&a.kids!=='None';
export const FREQ5=['Never','Rarely','A few times a month','Weekly','Daily'];
export const PHQ=['Not at all','Several days','More than half the days','Nearly every day'];

/* ---------- Questions ---------- */
export const Q=[
  // You
  {id:'name',ch:'you',type:'text',q:'What should we call you?',ph:'First name'},
  {id:'last',ch:'you',type:'text',q:'And your last name?',ph:'Last name',help:'Your spouse and crew see your full name.'},
  {id:'photo',ch:'you',type:'photo',optional:true,q:'Add a profile photo.',help:'Your spouse and crew see it next to your goals.'},
  {id:'bday',ch:'you',type:'bday',q:'When\'s your birthday?',help:'Health ranges shift with age, and your crew gets a heads-up on your birthday.'},
  {id:'phone',ch:'you',type:'tel',q:'Your mobile number?',help:'So your spouse and crew can text you straight from a red flag. Only they can see it.'},
  {id:'guide',ch:'you',type:'guide',q:'Pick your guide.',help:'Your guide walks you through setup and talks to you every day after. Each one has a different style. You can switch anytime.'},
  {id:'sex',ch:'you',type:'choice',q:'Male or female?',opts:['Male','Female'],help:'Used only for medical baselines. Waist, cholesterol and alcohol ranges differ by sex.'},
  {id:'status',ch:'you',type:'choice',q:'Relationship status?',opts:['Married','Engaged','Dating','Single','Separated','Divorced','Widowed']},
  {id:'kids',ch:'you',type:'choice',q:'Do you have kids?',opts:['None','Expecting','1','2','3','4 or more']},
  {id:'work',ch:'you',type:'choice',q:'What does work look like right now?',opts:['Full-time job','Own a business','Part-time','Stay-at-home parent','Student','Retired','Between jobs']},
  {id:'why',ch:'you',type:'multi',q:'What brought you here?',help:'Pick any that fit.',opts:['I feel stuck','Something has to change','I want to keep growing','I need people in my corner','A friend invited me']},
  // Faith
  {id:'walk',ch:'faith',type:'choice',q:'Where are you with Jesus?',opts:['Still exploring','New believer, under 2 years','Following 2 to 10 years','Following 10+ years','Walked away, coming back']},
  {id:'temp',ch:'faith',type:'scale',q:'How close do you feel to God right now?',n:5,ends:['Distant','Close']},
  {id:'bible',ch:'faith',type:'choice',q:'How many days a week do you read Scripture?',opts:['0','1–2','3–4','5–6','Every day']},
  {id:'prayer',ch:'faith',type:'choice',q:'Outside of meals, how often do you pray?',opts:['Rarely','Weekly','A few times a week','Daily','All through the day']},
  {id:'church',ch:'faith',type:'choice',q:'How often are you in church?',opts:['Rarely','Monthly','2–3 times a month','Every week','Every week, and I serve']},
  {id:'group',ch:'faith',type:'choice',q:'Do you have someone who asks you the hard questions?',opts:['Yes, regularly','Sometimes','Not really','This crew will be my first']},
  {id:'give',ch:'faith',type:'choice',q:'What share of your income do you give?',opts:['0%','1–4%','5–9%','10%','More than 10%','Prefer not to say']},
  {id:'fight',ch:'faith',type:'multi',private:true,q:'What\'s fighting against your faith right now?',help:'Pick any that are true.',opts:['Busyness','Doubt','Anxiety','Anger','Lust or porn','Pride','Bitterness','Addiction','Apathy','Shame','Nothing major right now']},
  // Marriage
  {id:'sname',ch:'marriage',type:'text',when:married,q:'What\'s your spouse\'s name?',ph:'First name'},
  {id:'years',ch:'marriage',type:'number',when:a=>a.status==='Married',q:'How many years have you been married?',min:0,max:80,unit:'years'},
  {id:'mscore',ch:'marriage',type:'scale',when:married,q:'Honestly, how is your marriage?',n:10,ends:['Struggling','Thriving']},
  {id:'dates',ch:'marriage',type:'choice',when:married,q:'Date nights in a typical month?',opts:['0','1','2','3','4 or more']},
  {id:'praytog',ch:'marriage',type:'choice',when:married,q:'How often do you pray together?',opts:FREQ5},
  {id:'conflict',ch:'marriage',type:'choice',when:married,q:'When you fight, it usually…',opts:['Gets resolved the same day','Takes a few days','Never really gets resolved','We avoid conflict altogether']},
  {id:'intimacy',ch:'marriage',type:'scale',when:married,spouseOnly:true,q:'How satisfied are you with your physical intimacy?',n:10,ends:['Not at all','Very']},
  {id:'spouse',ch:'marriage',type:'choice',when:married,q:'Invite your spouse to join you?',opts:['Yes, I\'ll invite them after setup','Maybe later'],help:'You\'ll get an invite link on the Team tab. Spouses see each other\'s goals: every rep, every red flag. You\'re a team. Private answers stay private, except the ones marked as shared with your spouse.'},
  {id:'rscore',ch:'marriage',type:'scale',when:a=>!married(a),q:'How connected do you feel to the people closest to you?',n:10,ends:['Alone','Deeply known']},
  {id:'rgoal',ch:'marriage',type:'choice',when:a=>!married(a),q:'For you, this goal is about…',opts:['Preparing for marriage','Dating with intention','Deeper friendships','Healing family relationships']},
  // Parenting
  {id:'ages',ch:'parenting',type:'multi',when:a=>hasKids(a)&&a.kids!=='Expecting',q:'How old are your kids?',opts:['Under 5','5–12','13–18','Adults']},
  {id:'oneone',ch:'parenting',type:'choice',when:a=>hasKids(a)&&a.kids!=='Expecting',q:'Focused one-on-one time with each kid, per week?',opts:['None','Under 1 hour','1–3 hours','More than 3 hours']},
  {id:'dinners',ch:'parenting',type:'choice',when:a=>hasKids(a)&&a.kids!=='Expecting',q:'Family dinners at the table, per week?',opts:['0–1','2–3','4–5','6–7']},
  {id:'famfaith',ch:'parenting',type:'choice',when:a=>hasKids(a)&&a.kids!=='Expecting',q:'How often does your family pray or read Scripture together?',opts:FREQ5},
  {id:'pscore',ch:'parenting',type:'scale',when:hasKids,q:'How present are you as a parent?',n:10,ends:['Mostly absent','Fully present'],help:'Present, not perfect.'},
  {id:'legacy',ch:'parenting',type:'choice',when:a=>!hasKids(a),q:'Who are you pouring into right now?',opts:['Mentoring someone','Nieces, nephews or godkids','Youth or kids ministry','No one yet']},
  // Health
  {id:'hw',ch:'health',type:'hw',q:'Height and weight?',help:'Used to calculate BMI.'},
  {id:'waist',ch:'health',type:'number',optional:true,q:'Waist measurement?',unit:'in',min:20,max:80,help:'Measure around your belly button, relaxed. Waist size predicts heart risk better than weight alone.'},
  {id:'rhr',ch:'health',type:'number',optional:true,q:'Resting heart rate?',unit:'bpm',min:30,max:150,help:'Check your watch, or count your pulse for 30 seconds after waking and double it.'},
  {id:'bp',ch:'health',type:'bp',optional:true,q:'Most recent blood pressure?',help:'From a doctor visit, a pharmacy machine or a home cuff.'},
  {id:'labs',ch:'health',type:'labs',optional:true,q:'Any recent bloodwork?',help:'From your last physical. Fill in what you have.'},
  {id:'cardio',ch:'health',type:'choice',q:'Minutes of exercise that gets your heart rate up, per week?',opts:['0','Under 75','75–149','150–300','More than 300'],help:'Brisk walking counts.'},
  {id:'lift',ch:'health',type:'choice',q:'Days a week of strength training?',opts:['0','1','2','3 or more']},
  {id:'steps',ch:'health',type:'choice',q:'Average daily steps?',opts:['Under 4,000','4,000–7,000','7,000–10,000','10,000+','No idea']},
  {id:'produce',ch:'health',type:'choice',q:'Servings of fruits and vegetables a day?',opts:['0–1','2–3','4–5','More than 5']},
  {id:'alcohol',ch:'health',type:'choice',q:'Alcoholic drinks in a typical week?',opts:['0','1–3','4–7','8–14','15 or more']},
  {id:'nicotine',ch:'health',type:'choice',q:'Nicotine? Cigarettes, vape, dip or pouches.',opts:['None','Occasionally','Daily']},
  {id:'physical',ch:'health',type:'choice',q:'When was your last physical?',opts:['Within a year','1–2 years ago','3+ years ago','Can\'t remember']},
  {id:'phq1',ch:'health',type:'choice',private:true,q:'Over the last 2 weeks, how often have you had little interest or pleasure in doing things?',opts:PHQ,help:'This and the next three questions come from the PHQ-2 and GAD-2, short screening tools doctors use.'},
  {id:'phq2',ch:'health',type:'choice',private:true,q:'Over the last 2 weeks, how often have you felt down, depressed or hopeless?',opts:PHQ},
  {id:'gad1',ch:'health',type:'choice',private:true,q:'Over the last 2 weeks, how often have you felt nervous, anxious or on edge?',opts:PHQ},
  {id:'gad2',ch:'health',type:'choice',private:true,q:'Over the last 2 weeks, how often have you been unable to stop or control worrying?',opts:PHQ},
  // Sleep
  {id:'sleep',ch:'sleep',type:'choice',q:'How many hours do you actually sleep on a work night?',opts:['Under 5','5–6','6–7','7–8','8–9','More than 9']},
  {id:'bed',ch:'sleep',type:'choice',q:'Usual bedtime?',opts:['Before 10 pm','10–11 pm','11 pm–midnight','After midnight','All over the place']},
  {id:'squality',ch:'sleep',type:'scale',q:'How rested do you feel when you wake up?',n:5,ends:['Wrecked','Fully rested']},
  {id:'snore',ch:'sleep',type:'choice',q:'Has anyone told you that you snore loudly or stop breathing in your sleep?',opts:['Yes','No','Not sure']},
  {id:'tired',ch:'sleep',type:'choice',q:'How often are you sleepy during the day?',opts:['Rarely','Some days','Most days']},
  {id:'phonebed',ch:'sleep',type:'choice',q:'Where is your phone at night?',opts:['In bed with me','On the nightstand','Out of the bedroom']},
  // Work & time
  {id:'whours',ch:'worklife',type:'choice',q:'Hours worked in a typical week?',opts:['Under 30','30–40','41–50','51–60','More than 60']},
  {id:'commute',ch:'worklife',type:'choice',q:'Commute time per week, round trip?',opts:['None','Under 2 hours','2–5 hours','5–10 hours','More than 10']},
  {id:'after',ch:'worklife',type:'choice',q:'How many nights a week do you work after dinner?',opts:['None','1–2','3–4','Most nights']},
  {id:'sabbath',ch:'worklife',type:'choice',q:'Do you take a full day of rest each week?',opts:['Yes, protected','Partly','No']},
  {id:'screen',ch:'worklife',type:'choice',q:'Non-work phone screen time per day?',opts:['Under 1 hour','1–2 hours','2–4 hours','More than 4 hours','No idea'],help:'Your phone tracks this. Check Screen Time or Digital Wellbeing.'},
  {id:'time',ch:'worklife',type:'time',q:'Budget your 119 hours.',help:'168 hours in a week, minus 49 for sleep. We filled in a realistic week from your answers. Adjust each slice until it looks like your real week.'},
  // Money
  {id:'budget',ch:'money',type:'choice',q:'Do you run a budget?',opts:['Written, every month','Rough idea in my head','No budget']},
  {id:'efund',ch:'money',type:'choice',q:'If income stopped, how long could you cover expenses?',opts:['Not even a month','1 month','1–3 months','3–6 months','6+ months']},
  {id:'debt',ch:'money',type:'multi',q:'What debt are you carrying?',help:'Pick all that apply.',opts:['Credit cards','Car loan','Student loans','Medical','Personal loans','Mortgage','Debt-free']},
  {id:'save',ch:'money',type:'choice',q:'What share of income do you save?',opts:['0%','1–5%','6–10%','11–15%','More than 15%']},
  {id:'mstress',ch:'money',type:'scale',q:'How much stress does money cause you?',n:10,ends:['None','Constant']},
  {id:'maligned',ch:'money',type:'choice',when:a=>a.status==='Married',q:'Are you and your spouse on the same page about money?',opts:['Yes','Mostly','No']},
  // Aim
  {id:'first',ch:'aim',type:'choice',q:'Which area are you going after first?',opts:['Faith','Marriage','Parenting','Health','Work-Life','Budget'],help:'You\'ll work all six. This one gets your best reps. You\'ll set the goal right after your baseline report.'}
];
/* ---------- Medical baselines ---------- */
export const SRC={cdc:'CDC adult BMI categories',nhlbi:'NIH / NHLBI waist guidance',aha:'AHA / ACC 2017 blood pressure guideline',ahahr:'American Heart Association',ada:'American Diabetes Association',chol:'NIH / NHLBI cholesterol guidance',hhs:'HHS Physical Activity Guidelines, 2nd ed.',dga:'Dietary Guidelines for Americans 2020–2025',aasm:'AASM / Sleep Research Society',phq:'PHQ-2 screen (score ≥3 = follow up)',gad:'GAD-2 screen (score ≥3 = follow up)',cdcfv:'CDC fruit & vegetable recommendations',steps:'Step-count studies (Lancet Public Health 2022)'};
export const SLEEPMID={'Under 5':4.5,'5–6':5.5,'6–7':6.5,'7–8':7.5,'8–9':8.5,'More than 9':9.5};
export function evalBMI(hw){if(!hw||!hw.ft||!hw.lb)return null;const inch=hw.ft*12+(+hw.in||0),b=703*hw.lb/(inch*inch);
  const s=b<18.5?['watch','Underweight']:b<25?['good','Healthy']:b<30?['watch','Overweight']:['flag','Obesity'];
  return {label:'BMI',v:b.toFixed(1),range:'18.5–24.9 healthy',st:s[0],note:s[1],src:SRC.cdc}}
export function evalWaist(w,sex){if(!w)return null;const lim=sex==='Female'?35:40;return {label:'Waist',v:w+' in',range:`≤${lim} in`,st:w>lim?'flag':w>lim-3?'watch':'good',note:w>lim?'Higher heart and diabetes risk':w>lim-3?'Close to the risk line':'Healthy',src:SRC.nhlbi}}
export function evalRHR(r){if(!r)return null;return {label:'Resting heart rate',v:r+' bpm',range:'60–100 bpm',st:r>100?'flag':r>85?'watch':'good',note:r>100?'Above normal range':r<60?'Below 60 (normal for many fit adults)':r>85?'Normal, upper end':'Normal',src:SRC.ahahr}}
export function evalBP(bp){if(!bp||!bp.s||!bp.d)return null;const s=+bp.s,d=+bp.d;let st,n;
  if(s>180||d>120){st='flag';n='Hypertensive crisis. Seek care now.'}else if(s>=140||d>=90){st='flag';n='Stage 2 hypertension'}else if(s>=130||d>=80){st='flag';n='Stage 1 hypertension'}else if(s>=120){st='watch';n='Elevated'}else{st='good';n='Normal'}
  return {label:'Blood pressure',v:`${s}/${d}`,range:'Under 120/80',st,note:n,src:SRC.aha}}
export function evalLabs(l,sex){const out=[];if(!l)return out;
  if(l.a1c){const v=+l.a1c;out.push({label:'A1C',v:v+'%',range:'Under 5.7%',st:v>=6.5?'flag':v>=5.7?'watch':'good',note:v>=6.5?'Diabetes range':v>=5.7?'Prediabetes range':'Normal',src:SRC.ada})}
  if(l.glu){const v=+l.glu;out.push({label:'Fasting glucose',v:v+' mg/dL',range:'Under 100',st:v>=126?'flag':v>=100?'watch':'good',note:v>=126?'Diabetes range':v>=100?'Prediabetes range':'Normal',src:SRC.ada})}
  if(l.tc){const v=+l.tc;out.push({label:'Total cholesterol',v:v+' mg/dL',range:'Under 200',st:v>=240?'flag':v>=200?'watch':'good',note:v>=240?'High':v>=200?'Borderline high':'Desirable',src:SRC.chol})}
  if(l.hdl){const v=+l.hdl,lim=sex==='Female'?50:40;out.push({label:'HDL',v:v+' mg/dL',range:`${lim}+`,st:v<lim?'watch':'good',note:v<lim?'Low':'Good',src:SRC.chol})}
  return out}
export function evalCardio(c,lift){if(!c)return null;const ok=['150–300','More than 300'].includes(c);const lok=['2','3 or more'].includes(lift);
  return {label:'Exercise',v:`${c} min · ${lift||'?'} lift days`,range:'150+ min cardio and 2+ strength days',st:ok&&lok?'good':ok||lok?'watch':'flag',note:ok&&lok?'Meets guideline':ok?'Add strength training':lok?'Add cardio minutes':'Below guideline',src:SRC.hhs}}
export function evalAlcohol(a,sex){if(!a)return null;const lim=sex==='Female'?7:14;const hi={'0':0,'1–3':3,'4–7':7,'8–14':14,'15 or more':15}[a];
  return {label:'Alcohol',v:a+' / week',range:sex==='Female'?'1 a day or less':'2 a day or less',st:hi>lim?'flag':hi>lim/2?'watch':'good',note:hi>lim?'Above guideline':'Within guideline',src:SRC.dga}}
export function evalSleep(s){if(!s)return null;const m=SLEEPMID[s];const debt=Math.max(0,(7-m)*7);
  return {label:'Sleep',v:s+' hrs',range:'7+ hours',st:m<6?'flag':m<7?'watch':m>9?'watch':'good',note:debt?`About ${debt.toFixed(1)} hours short each week`:m>9?'More than usual; mention to a doctor if new':'Meets baseline',src:SRC.aasm}}
export function evalProduce(p){if(!p)return null;return {label:'Fruits & vegetables',v:p+' / day',range:'About 5 servings',st:p==='0–1'?'flag':p==='2–3'?'watch':'good',note:'',src:SRC.cdcfv}}
export function evalSteps(s){if(!s||s==='No idea')return null;return {label:'Daily steps',v:s,range:'7,000+',st:s==='Under 4,000'?'flag':s==='4,000–7,000'?'watch':'good',note:'',src:SRC.steps}}
export function score(a,k1,k2){if(a[k1]==null||a[k2]==null)return null;return PHQ.indexOf(a[k1])+PHQ.indexOf(a[k2])}
export function evalMind(a){const out=[];const p=score(a,'phq1','phq2'),g=score(a,'gad1','gad2');
  if(p!=null&&p>=0)out.push({label:'Mood (PHQ-2)',v:p+' / 6',range:'Under 3',st:p>=3?'flag':p>=2?'watch':'good',note:p>=3?'Worth a conversation with a doctor':'',src:SRC.phq,private:true});
  if(g!=null&&g>=0)out.push({label:'Anxiety (GAD-2)',v:g+' / 6',range:'Under 3',st:g>=3?'flag':g>=2?'watch':'good',note:g>=3?'Worth a conversation with a doctor':'',src:SRC.gad,private:true});
  return out}

/* ---------- Time budget: the 119-hour foundation ----------
   Template = a realistic week for a full-time worker with a spouse and 4 kids, 7 hours of sleep a night.
   Each person's defaults start here and shift with their answers. */
export const TCATS=[
  {k:'work',n:'Work + commute',t:50,c:'var(--health)',sub:'45 at work including lunch, plus about 1 hour a day of driving. The immovable slice.'},
  {k:'family',n:'Family time',t:22,c:'var(--acc)',sub:'About 2 hours on weeknights plus 6 on each weekend day. Kids\' activities, homework, hanging out.'},
  {k:'meals',n:'Meals + cooking',t:10,c:'var(--budget)',sub:'Cooking, eating together and cleanup.'},
  {k:'home',n:'Home + errands',t:9,c:'var(--faith)',sub:'Laundry, yard, groceries, repairs. Usually underestimated.'},
  {k:'personal',n:'Personal, faith, rest',t:9,c:'var(--worklife)',sub:'Quiet time, Scripture, a hobby, or nothing. Cut first, and burnout follows when it hits zero.'},
  {k:'routines',n:'Daily routines',t:7,c:'color-mix(in srgb,var(--marriage) 55%,#fff)',sub:'Getting yourself and the kids out the door, baths, bedtime.'},
  {k:'workouts',n:'Workouts',t:6,c:'var(--parenting)',sub:'Four or five sessions of 60 to 75 minutes. Not a big slice, a protected one.'},
  {k:'marriage',n:'Marriage (just you two)',t:6,c:'var(--marriage)',sub:'A weekly date night plus about 30 minutes of real connection after the kids are down.'}
];
export function timeDefaults(a){
  const T=Object.fromEntries(TCATS.map(c=>[c.k,c.t]));
  const wh={'Under 30':25,'30–40':40,'41–50':45,'51–60':55,'More than 60':65}[a.whours];
  const cm={'None':0,'Under 2 hours':1,'2–5 hours':4,'5–10 hours':7,'More than 10':12}[a.commute];
  const working=!['Retired','Stay-at-home parent','Between jobs'].includes(a.work);
  if(!working)T.work=a.work==='Stay-at-home parent'?0:5;
  else if(wh!=null)T.work=wh+(cm??5);
  const kids=hasKids(a)&&a.kids!=='Expecting', n={'1':1,'2':2,'3':3,'4 or more':4}[a.kids]||0;
  if(!kids){T.family=married(a)?8:6;T.meals=7;T.routines=4}
  else{T.family=Math.round(14+2*n);T.meals=Math.round(7+.75*n);T.routines=Math.round(4+.75*n);if(a.work==='Stay-at-home parent')T.family+=30}
  if(!married(a))T.marriage=0;
  return T;
}
export function donut(T,size=200){
  const used=Object.values(T).reduce((x,y)=>x+y,0),tot=Math.max(119,used),c=size/2,r=size*.4,w=size*.16;let a0=-Math.PI/2,h='';
  const p=a=>`${(c+Math.cos(a)*r).toFixed(2)},${(c+Math.sin(a)*r).toFixed(2)}`;
  TCATS.forEach(k=>{const v=T[k.k];if(!v)return;const a1=a0+v/tot*Math.PI*2-.025;
    h+=`<path d="M${p(a0)} A${r},${r} 0 ${a1-a0>Math.PI?1:0} 1 ${p(a1)}" style="fill:none;stroke:${k.c};stroke-width:${w}"><title>${k.n}: ${v} hrs</title></path>`;a0=a1+.025});
  return `<svg viewBox="0 0 ${size} ${size}" role="img" aria-label="${used} of 119 waking hours budgeted"><circle cx="${c}" cy="${c}" r="${r}" style="fill:none;stroke:var(--s2);stroke-width:${w}"/>${h}
    <text x="${c}" y="${c+8}" text-anchor="middle" style="fill:var(--fg);font-family:var(--f-display);font-stretch:62%;font-weight:900;font-size:${size*.2}px">${used}</text>
    <text x="${c}" y="${c+26}" text-anchor="middle" style="fill:var(--mut);font-family:var(--f-mono);font-size:${size*.05}px;letter-spacing:.06em">OF 119 HRS</text></svg>`;
}


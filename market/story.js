// Story text is also the source for the order cards and writing feedback.
const CATALOG = Object.freeze({
  kit: 7, firstOrder: 3, clubOrder: 6, pack: 4, wholesale: 16, stand: 25,
  contents: ['A small pot', 'A packet of seeds', 'A plant label'],
  bring: ['Soil', 'Water'],
});
const CHAPTERS = [
  { id: 'lina', label: 'First order' },
  { id: 'lina-visit', label: 'Lina visits' },
  { id: 'supplier', label: 'Restock' },
  { id: 'omar', label: 'Club order' },
  { id: 'delivery', label: 'Delivery' },
  { id: 'omar-visit', label: 'Omar visits' },
  { id: 'expand', label: 'Expand' },
];
const DAYS = [
  'Monday · 9:00 a.m.', 'Friday · 4:00 p.m.', 'Next Monday · 9:00 a.m.',
  'Next Monday · 9:30 a.m.', 'Wednesday · 10:00 a.m.', 'Wednesday · Noon',
  'Wednesday · 12:15 p.m.', 'Thursday · 9:00 a.m.',
];
const MAIL = {
  lina: {
    name: 'Lina', initials: 'LI', style: 'rose', subject: 'Three garden kits for Saturday',
    kind: 'Customer', time: 'Monday, 9:00 a.m.', minStep: 0, actionStep: 0,
    body: [
      'Hi,',
      'I saw your sign when I walked past your office yesterday. My two children and I are going to plant seeds on Saturday morning. We each want a pot, so I’d like to buy **three garden kits**. My youngest also wants to write her name on her pot. Are **plant labels included**, or should I bring some from home?',
      'I can stop by **Friday at 4 p.m.** on my way home from work. I’ll only have a few minutes, so it would help if the kits were ready at the counter. If Friday is a problem, tell me before Thursday so I can make another plan.',
      'I saw that each kit costs seven coins. Please tell me the total in your reply so I can bring the right amount. I’ll come to the office door on the side facing the road. I’ve walked by the building before, but this will be my first time inside.',
      'Thanks,\nLina',
    ],
    checklist: ['Confirm how many kits you’ll set aside.', 'Give the total price.', 'Answer the question about labels.', 'Confirm the pickup day and time.'],
    draft: 'Hi Lina,\n\n',
    guidance: 'Keep the reply brief and friendly. Lina needs to know what to bring and when to arrive.',
    success: 'Perfect. I’ll bring the coins and see you at the counter on Friday. Thank you for getting the kits ready!',
  },
  omar: {
    name: 'Omar', initials: 'OM', style: 'blue', subject: 'Can you prepare six kits for our garden club?',
    kind: 'Customer', time: 'Next Monday, 9:00 a.m.', minStep: 2, actionStep: 3,
    body: [
      'Hello,',
      'Lina told me she picked up some garden kits from your office. I help run a small garden club. Six children are coming to our meeting on **Wednesday at 4 p.m.** We’re going to plant seeds together. I’d like each child to have their own kit, so I need **six kits** for the meeting.',
      'I can stop by on **Tuesday at 5 p.m.** to collect them. If that’s too soon, I could also come **Wednesday at noon**. I’d like to pick up all six together because I’ll be walking from work and can only make one trip.',
      'Please tell me what time you can have the full order ready. If you don’t have enough kits yet, let me know when you expect more. I can wait until Wednesday at noon, but I’ll need a firm answer by Monday evening so I have time to make another plan.',
      'Thanks,\nOmar',
    ],
    checklist: ['Confirm the full number of kits.', 'Tell him when he can collect all of them.', 'Give the total price.'],
    draft: 'Hi Omar,\n\n',
    guidance: 'He needs his whole order in one trip. Compare his pickup options with the supplier’s delivery time.',
    success: 'Wednesday at noon works for me. I’ll pick up all six together.',
  },
  maya: {
    name: 'Maya', initials: 'MA', style: 'amber', subject: 'This week’s garden kit delivery',
    kind: 'Supplier', time: 'Next Monday, 9:05 a.m.', minStep: 2, actionStep: 2,
    body: [
      'Hi,',
      'I have more garden kits ready for small shops. The kits are the same as the ones I brought you last week. Each one has a pot, a packet of seeds, and a plant label.',
      'I sell them in **packs of four**. Each kit costs you **four coins**, so one pack costs **16 coins**. You can order more than one pack, but one pack fits easily on the small shelf in your office if you already have a few kits there.',
      'I’m making deliveries on **Wednesday morning**. If you order by Monday evening, I can bring your pack at **10 a.m. Wednesday**. I’m visiting two shops before I reach your office, so please have someone there to open the door and check the pack when I arrive. I’ll wait while you count the kits.',
      'If these sell well, we can talk about a regular delivery. For now, send me the number of packs you want and I’ll save them for you.',
      'Maya',
    ],
    checklist: ['State how many packs your shop needs to fill Omar’s order.', 'Confirm the delivery day and time.'],
    draft: 'Hi Maya,\n\n',
    guidance: 'Check the shelf count and the club order before buying. You only need enough stock for this week.',
    success: 'I’ve set one pack aside. I’ll bring it to the office at 10 a.m. Wednesday.',
  },
  gift: {
    name: 'Nadia', initials: 'NA', style: 'violet', subject: 'Could you make a garden gift bundle?',
    kind: 'Customer', time: 'Thursday, 9:00 a.m.', minStep: 7,
    body: [
      'Hello,',
      'My neighbor Lina told me about your garden kits. My sister has just moved into a place with a small balcony. I’d like to bring her something she can plant there.',
      'Could you make a gift bundle with a garden kit and something extra? I’d like to give it to her on Sunday. Tell me what you would put in it and what it would cost.',
      'Thank you,\nNadia',
    ],
  },
};
const VISITORS = {
  1: {
    name: 'Lina', initials: 'LI', style: 'rose', title: 'Lina is at the door',
    body: 'Hi! I’m on my way home from work. Are my three garden kits ready? My youngest is already thinking about what to write on her label.',
    summary: 'Hand over three reserved kits and collect payment.',
    button: 'Complete sale · 21 coins',
  },
  4: {
    name: 'Maya', initials: 'MA', style: 'amber', title: 'Maya has arrived with your stock',
    body: 'Good morning. Here’s the pack we agreed on. Let’s count the four kits together before I head to my next stop.',
    summary: 'Add four garden kits to the shelf. The 16 coins were paid when you ordered.',
    button: 'Receive 4 kits',
  },
  5: {
    name: 'Omar', initials: 'OM', style: 'blue', title: 'Omar is at the counter',
    body: 'Hello! I’m here for the six kits. One of the children asked if she could plant her seeds at home. What comes in the kit? Is there anything she would need to bring herself?',
    summary: 'Use the product card to explain what’s included and what the child will need.',
    checklist: ['Name the three items inside the kit.', 'Tell him what the child needs to provide.'],
    guidance: 'Answer as if Omar is sitting across from you.',
    draft: '',
    button: 'Send answer & complete sale',
  },
};
const WORDS = {
  'garden kit': ['طقم زراعة', 'A set of things sold together for planting seeds.'],
  'packet': ['عبوة صغيرة', 'A small package that holds something such as seeds.'],
  'seeds': ['بذور', 'Small parts of a plant from which new plants can grow.'],
  'plant label': ['بطاقة تعريف للنبات', 'A tag that tells you what you planted.'],
  'included': ['مُتضمَّن', 'Already part of what the buyer receives.'],
  'counter': ['طاولة البيع', 'A surface in a shop where customers pay or collect orders.'],
  'pickup': ['استلام الطلب', 'A time or place where a customer collects an order.'],
  'total': ['المجموع', 'The full amount after adding the amounts together.'],
  'collect': ['يستلم', 'To go somewhere and pick something up.'],
  'stock': ['مخزون', 'Goods a shop has available to sell.'],
  'supplier': ['مُورِّد', 'A person or company that sells goods to a shop.'],
  'delivery': ['توصيل', 'The act of bringing goods to someone.'],
  'firm': ['مؤكّد', 'Decided and unlikely to change.'],
  'schedule': ['جدول المواعيد', 'A list of planned days and times.'],
  'pack': ['عبوة', 'Several items sold together as one group.'],
  'reserve': ['يحجز', 'To keep something for a particular customer.'],
  'receipt': ['إيصال', 'A record that shows what was paid for.'],
  'soil': ['تربة', 'Earth that plants can grow in.'],
  'bundle': ['حزمة', 'Several items sold together as one offer.'],
  'gift bundle': ['حزمة هدايا', 'A group of items packaged together as a gift.'],
};


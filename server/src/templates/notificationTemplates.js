/**
 * Editable Zomato-style funny notification templates for students
 */
const closingAlertTemplates = [
  {
    title: '⏰ Mess closing in 30 mins!',
    template: (messName, time) =>
      `Pet me chuhe kood rahe hain? ${messName} wraps up at ${time}. Run before the paneer becomes a memory!`
  },
  {
    title: '🚨 Last call for hot rotis!',
    template: (messName, time) =>
      `Mom: 'Beta khana khaya?' You: 'Abhi nahi, but ${messName} closes in 30 min!' Grab your thali before ${time}.`
  },
  {
    title: '🍲 Roti wait nahi karegi!',
    template: (messName, time) =>
      `Your study break called. It said dinner at ${messName} ends at ${time}. Drop the books, pick up a plate!`
  },
  {
    title: '🔥 Hot Gulab Jamun Alert!',
    template: (messName, time) =>
      `Breaking News: Fresh food spotted at ${messName}. Exactly 30 minutes on the clock until ${time}. You know what to do.`
  },
  {
    title: '🏃‍♂️ 30 Minutes on the Clock',
    template: (messName, time) =>
      `60 meals in your universal pass, don't let today's go to waste! ${messName} is shutting its counter at ${time}.`
  },
  {
    title: '👀 The mess auntie is looking at her watch...',
    template: (messName, time) =>
      `Counter closes strictly at ${time} at ${messName}. Don't settle for 2 AM Maggi when a full thali awaits!`
  }
];

const getRandomClosingTemplate = (messName, time) => {
  const item = closingAlertTemplates[Math.floor(Math.random() * closingAlertTemplates.length)];
  return {
    title: item.title,
    message: item.template(messName, time)
  };
};

module.exports = {
  closingAlertTemplates,
  getRandomClosingTemplate
};


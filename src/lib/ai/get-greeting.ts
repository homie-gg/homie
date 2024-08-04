const greetings = [
  'Yo',
  'Hi homie',
  'Hellooo',
  'Hihi',
  'Howdy',
  'Hey there',
  'Heyoo',
]

export function getGreeting() {
  return greetings[Math.floor(Math.random() * greetings.length)]
}

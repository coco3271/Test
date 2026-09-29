// The playable characters. Colours are hex; `ears` / `tail` pick the shapes in Avatar.js.
export const BUDDIES = [
  {
    id: 'bear', name: 'Zoomi Bear', ears: 'round', tail: 'puff',
    fur: 0xc68a5c, light: 0xf6dcc0, limbs: 0xc68a5c, shirt: 0xff6b9d, shorts: 0x4d7cff,
    shoes: 0xffffff, sole: 0xff9f1c, emblem: 0xffe066,
  },
  {
    id: 'bunny', name: 'Bo Bunny', ears: 'long', tail: 'puff',
    fur: 0xf7f1ee, light: 0xffd6e4, limbs: 0xf7f1ee, shirt: 0x5ed27a, shorts: 0xffb347,
    shoes: 0x6c63ff, sole: 0xffffff, emblem: 0xffffff,
  },
  {
    id: 'cat', name: 'Kiki Cat', ears: 'pointy', tail: 'long',
    fur: 0xffa24c, light: 0xfff0de, limbs: 0xffa24c, shirt: 0x9b6bff, shorts: 0x2ec4b6,
    shoes: 0xff5d8f, sole: 0xffffff, emblem: 0xffe066,
  },
  {
    id: 'panda', name: 'Pip Panda', ears: 'round', tail: 'puff', patches: true,
    fur: 0xffffff, light: 0xffffff, limbs: 0x2b2b35, dark: 0x2b2b35, shirt: 0xffd23f, shorts: 0xff5d8f,
    shoes: 0x3ec1ff, sole: 0xffffff, emblem: 0xff5d8f,
  },
];

export const buddyById = (id) => BUDDIES.find((b) => b.id === id) ?? BUDDIES[0];

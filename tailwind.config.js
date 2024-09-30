// module.exports = {
//     content: [
//       "./src/**/*.{js,jsx,ts,tsx}",
//     ],
//     theme: {
//       extend: {},
//     },
//     plugins: [],
//   }


  module.exports = {
    content: [
            "./src/**/*.{js,jsx,ts,tsx}",
        ],
    darkMode: 'class',
    theme: {
      extend: {},
    },
    variants: {
      extend: {
        backgroundColor: ['dark'],
        textColor: ['dark'],
        borderColor: ['dark'],
      },
    },
    plugins: [],
  }
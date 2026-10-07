import React from 'react';

export default function WhatsAppFloatingButton() {
  return (
    <a
      href="https://wa.me/917204709870?text=Hello%20Sporekart%2C%20I%20have%20an%20inquiry%20regarding%20mushroom%20products%2Ftraining."
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat with Sporekart on WhatsApp"
      className="fixed bottom-6 right-6 z-40 bg-emerald-600 hover:bg-emerald-500 text-white p-3.5 sm:p-4 rounded-full shadow-level-3 hover:shadow-2xl hover:scale-110 transition-all duration-300 flex items-center justify-center border-2 border-white/80 group"
    >
      <svg className="w-6 h-6 sm:w-7 sm:h-7 fill-current" viewBox="0 0 24 24">
        <path d="M12.012 2c-5.506 0-9.97 4.463-9.97 9.969 0 1.761.458 3.473 1.328 4.981L2 22l5.176-1.356c1.454.794 3.097 1.213 4.836 1.213 5.506 0 9.97-4.463 9.97-9.969 0-5.506-4.464-9.969-9.97-9.969zm0 18.257c-1.558 0-3.082-.419-4.41-1.211l-.316-.188-3.279.86.875-3.197-.206-.328A8.254 8.254 0 0 1 3.73 11.97c0-4.566 3.714-8.28 8.282-8.28 4.567 0 8.28 3.714 8.28 8.28 0 4.567-3.713 8.287-8.28 8.287z"/>
      </svg>
      <span className="max-w-0 overflow-hidden whitespace-nowrap group-hover:max-w-xs group-hover:ml-2 text-xs font-bold transition-all duration-300">
        WhatsApp Us
      </span>
    </a>
  );
}

import React from 'react';

export default function WhatsAppFloatingButton() {
  return (
    <a
      href="https://wa.me/917804709870?text=Hello%20Sporekart%2C%20I%20have%20an%20inquiry%20regarding%20mushroom%20products%2Ftraining."
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat with Sporekart on WhatsApp"
      className="fixed bottom-6 right-6 z-40 bg-emerald-600 hover:bg-emerald-500 text-white p-3.5 sm:p-4 rounded-full shadow-level-3 hover:shadow-2xl hover:scale-110 transition-all duration-300 flex items-center justify-center border-2 border-white/80 group"
    >
      <svg className="w-6 h-6 sm:w-7 sm:h-7 fill-current" viewBox="0 0 24 24">
        <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-1.143 4.174 4.174-1.143zm11.758-5.321c-.244-.122-1.446-.713-1.67-.795-.224-.082-.387-.122-.55.122-.163.244-.632.795-.774.958-.143.163-.285.183-.529.061-.244-.122-1.033-.381-1.968-1.215-.727-.648-1.218-1.449-1.36-1.693-.143-.244-.015-.376.107-.497.11-.11.244-.285.366-.427.122-.143.163-.244.244-.407.082-.163.041-.305-.02-.427-.061-.122-.55-1.323-.753-1.812-.197-.477-.398-.413-.55-.421-.143-.008-.305-.008-.467-.008-.163 0-.427.061-.65.305-.224.244-.855.835-.855 2.036 0 1.201.875 2.361.997 2.524.122.163 1.723 2.632 4.174 3.69 1.748.755 2.432.83 3.3.702.535-.079 1.646-.672 1.878-1.322.232-.65.232-1.206.163-1.322-.069-.116-.231-.177-.475-.299z"/>
      </svg>
      <span className="max-w-0 overflow-hidden whitespace-nowrap group-hover:max-w-xs group-hover:ml-2 text-xs font-bold transition-all duration-300">
        WhatsApp Us
      </span>
    </a>
  );
}

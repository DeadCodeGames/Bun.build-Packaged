import React from 'react';
import { createRoot } from 'react-dom/client';
import image from '@/img/my_test_image.png';
import '@/index.css';

function App() {
    return (
        <div>
            <span>Hello from Test Project Directory.</span>
            <img src={image} alt=":3" />
        </div>
    )
}

createRoot(document.querySelector("div#root") as HTMLElement).render(<App />);
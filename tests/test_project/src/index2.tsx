import React from 'react';
import { createRoot } from 'react-dom/client';
import image from '@/img/my_other_test_image.jpg';
import '@/index.css';

function App() {
    return (
        <div>
            <span>Hello from another Test Project Directory.</span>
            <img src={image} alt=":3" />
        </div>
    )
}

createRoot(document.querySelector("div#root2") as HTMLElement).render(<App />);
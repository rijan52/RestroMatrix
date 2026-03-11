import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import { DriverProvider } from './context/DriverContext.jsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
        <DriverProvider>
            <App />
        </DriverProvider>
    </React.StrictMode>,
)
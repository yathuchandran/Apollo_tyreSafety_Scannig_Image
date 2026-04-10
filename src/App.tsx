import './App.css'
import { Routes, Route, BrowserRouter } from 'react-router-dom';
// import Home from './pages/home';
import AddComplaint from './pages/addComplaint';
// import TyreTreadRecorder from './pages/checking';
import Checking from './pages/checking';



function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route index element={<Checking />} />
        <Route path="/add-complaint" element={<AddComplaint />} />
        
      </Routes>
    </BrowserRouter>
  )
}

export default App
import React, { useState } from 'react'
import Sidebar from './Components/Sidebar'
import {Route, Routes, useLocation} from 'react-router-dom' 
import ChatBox from './Components/ChatBox'
import Credits from './Pages/Credits'
import Community from './Pages/Community'
import { assets } from './assets/assets'
import './assets/prism.css'
import Loading from './Pages/Loading'
import { useAppContext } from './Context/AppContext'
import Login from './Pages/Login'


const App = () => {

  const {user} = useAppContext()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const {pathname} = useLocation()

  if(pathname === '/loading') return <Loading/>
 
  return (
    <>
    {!isMenuOpen && <img src={assets.menu_icon} className='absolute top-3 left-3 w-8 h-8 cursor-pointer md:hidden not-dark:invert' onClick={()=>setIsMenuOpen(true)}/>}

    {user ? (
      <div className='dark:bg-gradient-to-b from-[#242124] to-[#000000] dark:text-white'>
      <div className='flex h-screen w-screen'>
        <Sidebar isMenuOpen={isMenuOpen} setIsMenuOpen ={setIsMenuOpen}/>
        <Routes>
          <Route path='/' element={<ChatBox/>}/>
          <Route path='/credits' element={<Credits/>}/>
          <Route path='/community' element={<Community/>}/>
        </Routes>
      </div>
    </div>

    ) : (
      <div className='bg-gradient-to-b from-[#242124] to-[#000000] flex items-center justify-center h-screen w-screen'>
        <Login/>
      </div>
    )}
    
      
    </>
  )
}

export default App

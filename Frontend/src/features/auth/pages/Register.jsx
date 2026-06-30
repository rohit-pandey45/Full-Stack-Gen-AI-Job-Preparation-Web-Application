import React,{useState} from 'react'
import { useNavigate,Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth.js'
import { GoogleLogin } from '@react-oauth/google'

const Register = () => {

    const navigate = useNavigate()
    const [ username, setUsername ] = useState("")
    const [ email, setEmail ] = useState("")
    const [ password, setPassword ] = useState("")

    const {loading,handleRegister,handleGoogleLogin} = useAuth()
    
    const handleSubmit = async (e) => {
        e.preventDefault()
        await handleRegister({username,email,password})
        navigate("/")
    }

     const handleGoogleSuccess = async (credentialResponse) => {
        await handleGoogleLogin(credentialResponse.credential)
        navigate('/')
    }

    if(loading){
        return (<main><h1>Loading.......</h1></main>)
    }

  return (
    <main>
        <div className="form-container">
            <h1>Create Account</h1>
            <form onSubmit={handleSubmit}>
            <div className="input-group">
                <label htmlFor="email">Username</label>
                <input 
                onChange={(e) => { setUsername(e.target.value) }}
                type="name" id="username" name='username' placeholder='Enter your username' />
            </div>
            <div className="input-group">
                <label htmlFor="email">Email</label>
                <input 
                onChange={(e) => { setEmail(e.target.value) }}
                type="email" id="email" name='email' placeholder='Enter email address' />
            </div>
            <div className="input-group">
                <label htmlFor="password">Password</label>
                <input 
                onChange={(e) => { setPassword(e.target.value) }}
                type="password" id="password" name='password' placeholder='Enter your password' />
            </div>
            <button className='button primary-button'>Register</button>
            </form>
            <div className="divider">or</div>

                <GoogleLogin
                    onSuccess={handleGoogleSuccess}
                    onError={() => console.log("Google Registration Failed")}
                />
            <p>Already have an account? <Link to={"/login"} >Login</Link> </p>
        </div>
    </main>
  )
}

export default Register
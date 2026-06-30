import React,{useState} from 'react'
import { useNavigate, Link } from 'react-router-dom'
import "../auth.form.scss"
import { useAuth } from '../hooks/useAuth.js'
import { GoogleLogin } from '@react-oauth/google'


const Login = () => {

    const { loading, handleLogin, handleGoogleLogin } = useAuth()
    const navigate = useNavigate()

    const [ email, setEmail ] = useState("")
    const [ password, setPassword ] = useState("")

    const handleSubmit = async (e) => {
        e.preventDefault()
        await handleLogin({email,password})
        navigate('/')
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
                <h1>Welcome Back!!</h1>
                <form onSubmit={handleSubmit}>
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
                            type="password" id="password" name='password' placeholder='Enter password' />
                    </div>
                    <button className='button primary-button' >Login</button>
                </form>
                <div className="divider">or</div>

                <GoogleLogin
                    onSuccess={handleGoogleSuccess}
                    onError={() => console.log("Google Login Failed")}
                />
                <p>Don't have an account? <Link to={"/register"} >Register</Link> </p>
            </div>
        </main>
    )
}

export default Login
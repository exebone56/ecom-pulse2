import Input from '../UI/Buttons/Input'
import "./LoginForm.css"

const LoginForm = ({handleSubmit, email, password, setEmail, setPassword, error, loading}) => {
  return (
    <div className="relative z-10 flex items-center justify-center min-h-screen px-4 sm:px-6 lg:px-8">
        <div className="bg-white/10 backdrop-blur-md p-8 rounded-2xl border border-white/20 shadow-2xl w-full max-w-md">
            <div className='text-center mb-6 sm:mb-8'>
              <div class="box">
                    <div class="title">
                        <span class="block"></span>
                        <h1>ECOM-PULSE<span></span></h1>
                    </div>
                    <div class="role">
                        <div class="block"></div>
                        <p>Система управления<br/>данными на маркетплейсах</p>
                    </div>
                </div>
            </div>
            
            <form className='space-y-4' onSubmit={handleSubmit}>
              <div>
                <Input 
                  type="text" 
                  placeholder="Email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div>
                <Input 
                  type="password" 
                  placeholder="Пароль" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              {error && <div style={{color: 'red'}}>{error}</div>}
              <div className='flex justify-center'>
                 <button type="submit" disabled={loading} className='w-full bg-accent hover:bg-[#C02C2C] text-white py-3 rounded-lg font-medium transition-colors duration-300 transform hover:scale-[1.02] active:scale-[0.98]'>{loading ? 'Вход...' : 'Войти в систему'}</button>
              </div>
             
          </form>
        </div>        
    </div>

  )
}

export default LoginForm
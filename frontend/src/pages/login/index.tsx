import LoginForm from './components/LoginForm';
import './scss/login-page.scss';

const Login = () => {
  return (
    <>
      <section id="admin-body">
        <div className="body-wrap">
          <LoginForm />
        </div>
      </section>
    </>
  );
};

export default Login;

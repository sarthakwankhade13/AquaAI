import LeftPromoPanel from "../components/LeftPromoPanel";
import SignupForm from "../components/SignupForm";

const SignupPage = () => {
  return (
    <div className="auth-page">

      {/* Left AquaAI promotional section */}
      <LeftPromoPanel />

      {/* Right signup section */}
      <div className="auth-right">
        <SignupForm />
      </div>

    </div>
  );
};

export default SignupPage;
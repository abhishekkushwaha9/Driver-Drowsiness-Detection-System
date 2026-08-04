import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  sendPasswordResetEmail, 
  updateProfile,
  GoogleAuthProvider,
  signInWithPopup
} from "firebase/auth";
import { auth, db } from "../firebase/config";
import { collection, query, where, getDocs, doc, setDoc, getDoc } from "firebase/firestore";
import "./login.scss";

const googleProvider = new GoogleAuthProvider();

const AuthPage = () => {
  const navigate = useNavigate();
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [formData, setFormData] = useState({ 
    name: "", 
    email: "", 
    mobile: "", 
    identifier: "", 
    password: "", 
    confirmPassword: "" 
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [showSidebar, setShowSidebar] = useState(false);

  const handleChange = (e) => {
    let { name, value } = e.target;
    
    if (name === "name") value = value.slice(0, 50);
    else if (name === "mobile") value = value.replace(/\D/g, "").slice(0, 15);
    else if (name === "password" || name === "confirmPassword") value = value.slice(0, 15);
    
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (error) setError("");
  };

  const toggleMode = () => {
    setIsLoginMode(!isLoginMode);
    setError("");
    setSuccessMessage("");
    setFormData({ 
      name: "", 
      email: "", 
      mobile: "", 
      identifier: "", 
      password: "", 
      confirmPassword: "" 
    });
  };

  const validateForm = () => {
    setError("");
    if (!isLoginMode) {
      if (!formData.name.trim()) return setError("Please enter your name"), false;
      if (formData.name.length < 2) return setError("Name must be at least 2 characters"), false;
      if (!formData.email.trim()) return setError("Please enter your email address"), false;
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) return setError("Please enter a valid email address"), false;
      if (!formData.mobile.trim()) return setError("Please enter your mobile number"), false;
      if (formData.mobile.length < 10) return setError("Mobile number must be at least 10 digits"), false;
      if (formData.password.length < 6) return setError("Password must be at least 6 characters"), false;
      if (formData.password !== formData.confirmPassword) return setError("Passwords do not match"), false;
    } else {
      if (!formData.identifier.trim()) return setError("Please enter your email or mobile number"), false;
      if (!formData.password) return setError("Please enter your password"), false;
    }
    return true;
  };

  const findUserByMobile = async (mobile) => {
    try {
      const usersRef = collection(db, "users");
      const q = query(usersRef, where("mobile", "==", mobile));
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        return null;
      }
      
      return querySnapshot.docs[0].data();
    } catch (err) {
      console.error("Error finding user by mobile:", err);
      throw err;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    
    setIsLoading(true);
    setError("");
    setSuccessMessage("");
    
    try {
      if (isLoginMode) {
        const identifier = formData.identifier.trim();
        console.log("Attempting login with identifier:", identifier);
        
        if (identifier.includes("@")) {
          console.log("Branch: Email login");
          const userCredential = await signInWithEmailAndPassword(auth, identifier, formData.password);
          console.log("Login successful, user UID:", userCredential.user.uid);
          const userDoc = await getDoc(doc(db, "users", userCredential.user.uid));
          if (userDoc.exists()) console.log("User data found in Firestore:", userDoc.data());
          navigate("/");
        } else {
          console.log("Branch: Mobile login");
          const userData = await findUserByMobile(identifier);
          if (!userData) {
            console.error("Mobile number not found in Firestore");
            setError("No account found with this mobile number");
            setIsLoading(false);
            return;
          }
          console.log("Found user email for mobile:", userData.email);
          const userCredential = await signInWithEmailAndPassword(auth, userData.email, formData.password);
          console.log("Login successful via mobile branch, UID:", userCredential.user.uid);
          navigate("/");
        }
      } else {
        console.log("Attempting signup for email:", formData.email);
        const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
        await updateProfile(userCredential.user, { displayName: formData.name });
        await setDoc(doc(db, "users", userCredential.user.uid), {
          uid: userCredential.user.uid,
          name: formData.name,
          email: formData.email,
          mobile: formData.mobile,
          createdAt: new Date(),
          emergencyContacts: [],
          emergencyAlerts: [],
          roles: ["user"]
        });
        console.log("Signup successful!");
        setSuccessMessage("Account created successfully! Redirecting...");
        setTimeout(() => navigate("/"), 1500);
      }
    } catch (error) {
      console.error("Authentication submission error:", error);
      setError(getErrorMessage(error.code) || error.message || "An unknown error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!formData.identifier) {
      setError("Please enter your email address to reset password");
      return;
    }
    if (!formData.identifier.includes("@")) {
      setError("Please enter your email address, not mobile number, to reset password");
      return;
    }
    try {
      setIsLoading(true);
      await sendPasswordResetEmail(auth, formData.identifier);
      setSuccessMessage("Password reset email sent! Check your inbox.");
    } catch (error) {
      console.error("Password reset error:", error);
      setError(getErrorMessage(error.code) || error.message || "An unknown error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError("");
    setSuccessMessage("");
    setIsLoading(true);
    try {
      const googleProvider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      const userDocRef = doc(db, "users", user.uid);
      const userDoc = await getDoc(userDocRef);
      if (!userDoc.exists()) {
        await setDoc(userDocRef, {
          uid: user.uid,
          name: user.displayName || "",
          email: user.email || "",
          mobile: user.phoneNumber || "",
          createdAt: new Date(),
          emergencyContacts: [],
          emergencyAlerts: [],
          roles: ["user"]
        });
      }
      setSuccessMessage("Logged in with Google!");
      setTimeout(() => navigate("/"), 1000);
    } catch (err) {
      setError(err.message || "Google sign-in failed");
    } finally {
      setIsLoading(false);
    }
  };

  const getErrorMessage = (errorCode) => {
    const errorMessages = {
      "auth/invalid-email": "Invalid email address format.",
      "auth/user-disabled": "This account has been disabled.",
      "auth/user-not-found": "No account found with this email address.",
      "auth/wrong-password": "Incorrect password. Please try again.",
      "auth/invalid-credential": "Email or password is incorrect. Please try again.",
      "auth/email-already-in-use": "This email is already registered. Please try logging in.",
      "auth/weak-password": "Password must be at least 6 characters.",
      "auth/too-many-requests": "Too many failed attempts. Please try again later.",
      "auth/invalid-phone-number": "Invalid phone number format.",
      "auth/operation-not-allowed": "This operation is not allowed. Please contact support.",
      "auth/network-request-failed": "Network error. Please check your internet connection."
    };
    return errorMessages[errorCode] || `An error occurred. Please try again. (${errorCode})`;
  };

  return (
    <div className="auth-layout">
      {/* Mobile Navigation Toggle */}
      <div className="mobile-nav">
        <button 
          className="nav-toggle"
          onClick={() => setShowSidebar(!showSidebar)}
        >
          <i className="fas fa-bars"></i>
        </button>
      </div>

      {/* Left Side - Brand Section */}
      <div className={`auth-brand ${showSidebar ? 'visible-mobile' : 'hidden-mobile'}`}>
        <div className="brand-content">
          <div className="brand-logo">
            <i className="fas fa-shield-alt"></i>
          </div>
          <h1 className="brand-title">WELCOME TO</h1>
          <p className="brand-subtitle">NAPGUARD</p>
          
          <div className="brand-features">
            <div className="feature">
              <i className="fas fa-bolt"></i>
              <span>Fast & Secure Authentication</span>
            </div>
            <div className="feature">
              <i className="fas fa-users"></i>
              <span>Real-Time Alert System</span>
            </div>
            <div className="feature">
              <i className="fas fa-lock"></i>
              <span>Trusted by Professional Drivers</span>
            </div>
            <div className="feature">
              <i className="fas fa-mobile-alt"></i>
              <span>24/7 Real-Time Monitoring</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Form Section */}
      <div className="auth-form-section">
        <div className="auth-form-container">
          <div className="auth-card">
            <div className="auth-header">
              <div className="auth-icon">
                <i className="fas fa-user-circle"></i>
              </div>
              <h1 className="auth-title">
                {isLoginMode ? "Welcome Back" : "Create Account"}
              </h1>
              <p className="auth-subtitle">
                {isLoginMode ? "Sign in to your account" : "Join us today"}
              </p>
            </div>
            
            {error && (
              <div className="auth-message error-message">
                <i className="fas fa-exclamation-circle"></i>
                <span>{error}</span>
                <button onClick={() => setError("")} className="close-error">
                  &times;
                </button>
              </div>
            )}
            
            {successMessage && (
              <div className="auth-message success-message">
                <i className="fas fa-check-circle"></i>
                <span>{successMessage}</span>
              </div>
            )}
            
            <form className="auth-form" onSubmit={handleSubmit}>
              {!isLoginMode ? (
                <>
                  <div className="form-group">
                    <label className="form-label">
                      <i className="fas fa-user"></i>
                      Full Name 
                      <span className="char-count">{formData.name.length}/50</span>
                    </label>
                    <input 
                      type="text" 
                      name="name" 
                      value={formData.name} 
                      onChange={handleChange} 
                      placeholder="Enter your full name" 
                      disabled={isLoading} 
                      className="form-input" 
                    />
                  </div>
                  
                  <div className="form-group">
                    <label className="form-label">
                      <i className="fas fa-envelope"></i>
                      Email Address
                    </label>
                    <input 
                      type="email" 
                      name="email" 
                      value={formData.email} 
                      onChange={handleChange} 
                      placeholder="Enter your email" 
                      disabled={isLoading} 
                      className="form-input" 
                    />
                  </div>
                  
                  <div className="form-group">
                    <label className="form-label">
                      <i className="fas fa-mobile-alt"></i>
                      Mobile Number 
                      <span className="char-count">{formData.mobile.length}/15</span>
                    </label>
                    <input 
                      type="text" 
                      name="mobile" 
                      value={formData.mobile} 
                      onChange={handleChange} 
                      placeholder="Enter your mobile number" 
                      disabled={isLoading} 
                      className="form-input" 
                    />
                  </div>
                </>
              ) : (
                <div className="form-group">
                  <label className="form-label">
                    <i className="fas fa-user"></i>
                    Email or Mobile Number
                  </label>
                  <input 
                    type="text" 
                    name="identifier" 
                    value={formData.identifier} 
                    onChange={handleChange} 
                    placeholder="Enter your email or mobile number" 
                    disabled={isLoading} 
                    className="form-input" 
                  />
                </div>
              )}
              
              <div className="form-group">
                <label className="form-label">
                  <i className="fas fa-lock"></i>
                  Password 
                  <span className="char-count">{formData.password.length}/15</span>
                </label>
                <input 
                  type="password" 
                  name="password" 
                  value={formData.password} 
                  onChange={handleChange} 
                  placeholder="Enter your password" 
                  disabled={isLoading} 
                  className="form-input" 
                />
              </div>
              
              {!isLoginMode && (
                <div className="form-group">
                  <label className="form-label">
                    <i className="fas fa-lock"></i>
                    Confirm Password
                  </label>
                  <input 
                    type="password" 
                    name="confirmPassword" 
                    value={formData.confirmPassword} 
                    onChange={handleChange} 
                    placeholder="Confirm your password" 
                    disabled={isLoading} 
                    className="form-input" 
                  />
                </div>
              )}
              
              <div className="form-options">
                {isLoginMode && (
                  <button 
                    type="button" 
                    className="forgot-password" 
                    onClick={handleForgotPassword} 
                    disabled={isLoading}
                  >
                    Forgot Password?
                  </button>
                )}
              </div>
              
              <button 
                type="submit" 
                className="auth-submit-btn" 
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <i className="fas fa-spinner fa-spin"></i>
                    {isLoginMode ? "Signing in..." : "Creating account..."}
                  </>
                ) : isLoginMode ? (
                  <>
                    <i className="fas fa-sign-in-alt"></i>
                    Sign In
                  </>
                ) : (
                  <>
                    <i className="fas fa-user-plus"></i>
                    Create Account
                  </>
                )}
              </button>
            </form>
            
            <div className="auth-switch">
              <p>
                {isLoginMode ? "Don't have an account? " : "Already have an account? "}
                <button 
                  type="button" 
                  onClick={toggleMode} 
                  className="switch-mode-btn" 
                  disabled={isLoading}
                >
                  {isLoginMode ? "Sign up" : "Sign in"}
                </button>
              </p>
            </div>
            
            <div className="auth-divider">
              <span>Or continue with</span>
            </div>
            
            <div className="social-auth">
              <button 
                className="social-btn google-btn" 
                onClick={handleGoogleSignIn} 
                disabled={isLoading}
              >
                <i className="fab fa-google"></i>
                Google
              </button>
            </div>
            
            <div className="auth-footer">
              <p>© 2024 Your Company. All rights reserved.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
import { useState } from "react";
import { Link, Navigate } from "react-router";
import { motion } from "framer-motion";
import { Shield, Lock, Mail, Eye, EyeOff } from "lucide-react";
import { useAuthStore } from "../../store/useAuthStore.js";
import toast from "react-hot-toast";

const AdminLogin = () => {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const { authUser, login } = useAuthStore();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const success = await login(formData);
      
      if (success) {
        // Redirect will happen automatically through the Navigate component
        window.location.href = "/admin";
      }
    } catch (error) {
      toast.error("Login failed. Please check your credentials.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 to-secondary/10">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md p-8"
      >
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full mb-4">
            <Shield className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-3xl font-bold text-base-content">Admin Portal</h1>
          <p className="text-base-content/70 mt-2">
            Sign in to access the admin dashboard
          </p>
        </div>

        <div className="card bg-base-100 shadow-xl">
          <div className="card-body">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="form-control">
                <label className="label">
                  <span className="label-text text-base-content">Email</span>
                </label>
                <div className="input-group">
                  <span className="bg-base-200 border border-base-300 border-r-0 rounded-l-lg px-3 flex items-center">
                    <Mail className="w-4 h-4 text-base-content/70" />
                  </span>
                  <input
                    type="email"
                    name="email"
                    placeholder="admin@example.com"
                    className="input input-bordered flex-1 rounded-r-lg"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text text-base-content">Password</span>
                </label>
                <div className="input-group">
                  <span className="bg-base-200 border border-base-300 border-r-0 rounded-l-lg px-3 flex items-center">
                    <Lock className="w-4 h-4 text-base-content/70" />
                  </span>
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    placeholder="••••••••"
                    className="input input-bordered flex-1 rounded-none"
                    value={formData.password}
                    onChange={handleInputChange}
                    required
                  />
                  <button
                    type="button"
                    className="btn btn-square"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="form-control">
                <button
                  type="submit"
                  className="btn btn-primary w-full"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <span className="loading loading-spinner loading-sm"></span>
                      Signing in...
                    </>
                  ) : (
                    "Sign In"
                  )}
                </button>
              </div>
            </form>

            <div className="divider">OR</div>

            <div className="text-center">
              <p className="text-sm text-base-content/70">
                Regular user?{" "}
                <Link to="/login" className="text-primary hover:underline">
                  Sign in here
                </Link>
              </p>
            </div>
          </div>
        </div>

        <div className="mt-8 text-center">
          <div className="alert alert-info">
            <Shield className="w-4 h-4" />
            <span className="text-sm">
              This portal is restricted to administrators only.
            </span>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default AdminLogin;

import { useEffect, useRef, useState } from "react";
import { Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { useCustomerAuth } from "@/lib/customerAuth";

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

export function AuthModal({ open, onOpenChange, defaultTab = "login" }) {
  const [tab, setTab] = useState(defaultTab);
  const [prefillEmail, setPrefillEmail] = useState("");
  const [forgotMode, setForgotMode] = useState(false);

  useEffect(() => {
    if (open) {
      setTab(defaultTab);
      setForgotMode(false);
    }
  }, [open, defaultTab]);

  function switchToRegister(email) {
    setPrefillEmail(email || "");
    setForgotMode(false);
    setTab("register");
  }

  function handleTabChange(next) {
    setForgotMode(false);
    setTab(next);
  }

  const title = forgotMode ? "Reset your password" : tab === "login" ? "Welcome back" : "Create your account";
  const description = forgotMode
    ? "We'll email you a code to confirm it's you."
    : tab === "login"
      ? "Sign in to track orders and check out faster."
      : "Sign up to track orders and check out faster.";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        {forgotMode ? (
          <ForgotPasswordForm onDone={() => setForgotMode(false)} />
        ) : (
          <>
            <Tabs value={tab} onValueChange={handleTabChange} className="mt-2">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login">Log in</TabsTrigger>
                <TabsTrigger value="register">Sign up</TabsTrigger>
              </TabsList>
              <TabsContent value="login" className="pt-4">
                <LoginForm
                  onSuccess={() => onOpenChange(false)}
                  onSwitchToRegister={switchToRegister}
                  onForgotPassword={() => setForgotMode(true)}
                />
              </TabsContent>
              <TabsContent value="register" className="pt-4">
                <RegisterForm onSuccess={() => onOpenChange(false)} initialEmail={prefillEmail} />
              </TabsContent>
            </Tabs>

            <GoogleButton onSuccess={() => onOpenChange(false)} />
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

function LoginForm({ onSuccess, onSwitchToRegister, onForgotPassword }) {
  const { login } = useCustomerAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState("");
  const [needsVerification, setNeedsVerification] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setNeedsVerification(false);
    setLoading(true);
    try {
      await login(email, password, rememberMe);
      onSuccess();
    } catch (err) {
      setError(err.message || "Login failed");
      setNeedsVerification(err.message?.toLowerCase().includes("verify"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="space-y-1.5">
        <Label htmlFor="login-email">Email</Label>
        <Input id="login-email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="login-password">Password</Label>
        <Input
          id="login-password"
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </div>
      <div className="flex items-center justify-between">
        <label className="flex items-center gap-2 text-sm text-muted-foreground">
          <input
            type="checkbox"
            checked={rememberMe}
            onChange={(e) => setRememberMe(e.target.checked)}
            className="h-4 w-4 rounded border-border"
          />
          Keep me signed in on this device
        </label>
        <button
          type="button"
          onClick={onForgotPassword}
          className="text-sm text-primary underline underline-offset-2"
        >
          Forgot password?
        </button>
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      {needsVerification && (
        <button
          type="button"
          onClick={() => onSwitchToRegister(email)}
          className="text-sm text-primary underline underline-offset-2"
        >
          Finish verifying this email
        </button>
      )}
      <Button type="submit" disabled={loading} className="w-full rounded-full">
        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Log in
      </Button>
    </form>
  );
}

function RegisterForm({ onSuccess, initialEmail = "" }) {
  const { register, sendOtp } = useCustomerAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState(initialEmail);
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState("details"); // "details" | "code"
  const [error, setError] = useState("");
  const [sendingCode, setSendingCode] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [resendIn, setResendIn] = useState(0);

  useEffect(() => {
    if (initialEmail) setEmail(initialEmail);
  }, [initialEmail]);

  useEffect(() => {
    if (resendIn <= 0) return undefined;
    const timer = setInterval(() => setResendIn((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(timer);
  }, [resendIn]);

  async function handleSendCode(e) {
    e.preventDefault();
    setError("");
    setSendingCode(true);
    try {
      await sendOtp(email, "register");
      setStep("code");
      setResendIn(30);
    } catch (err) {
      setError(err.message || "Could not send the verification code");
    } finally {
      setSendingCode(false);
    }
  }

  async function handleResend() {
    setError("");
    try {
      await sendOtp(email, "register");
      setResendIn(30);
    } catch (err) {
      setError(err.message || "Could not resend the code");
    }
  }

  async function handleVerifyAndCreate(e) {
    e.preventDefault();
    setError("");
    if (otp.length !== 6) {
      setError("Enter the 6-digit code");
      return;
    }
    setSubmitting(true);
    try {
      await register({ name, email, password, otp });
      onSuccess();
    } catch (err) {
      setError(err.message || "Registration failed");
    } finally {
      setSubmitting(false);
    }
  }

  if (step === "code") {
    return (
      <form onSubmit={handleVerifyAndCreate} className="space-y-4">
        <p className="text-sm text-muted-foreground">
          We sent a 6-digit code to <strong className="text-foreground">{email}</strong>.
        </p>
        <div className="flex justify-center">
          <InputOTP maxLength={6} value={otp} onChange={setOtp}>
            <InputOTPGroup>
              <InputOTPSlot index={0} />
              <InputOTPSlot index={1} />
              <InputOTPSlot index={2} />
              <InputOTPSlot index={3} />
              <InputOTPSlot index={4} />
              <InputOTPSlot index={5} />
            </InputOTPGroup>
          </InputOTP>
        </div>
        {error && <p className="text-center text-sm text-destructive">{error}</p>}
        <Button type="submit" disabled={submitting} className="w-full rounded-full">
          {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Verify & create account
        </Button>
        <div className="text-center text-sm text-muted-foreground">
          {resendIn > 0 ? (
            <span>Resend code in {resendIn}s</span>
          ) : (
            <button type="button" onClick={handleResend} className="text-primary underline underline-offset-2">
              Resend code
            </button>
          )}
        </div>
      </form>
    );
  }

  return (
    <form onSubmit={handleSendCode} className="space-y-3">
      <div className="space-y-1.5">
        <Label htmlFor="register-name">Name</Label>
        <Input id="register-name" required value={name} onChange={(e) => setName(e.target.value)} />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="register-email">Email</Label>
        <Input
          id="register-email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="register-password">Password</Label>
        <Input
          id="register-password"
          type="password"
          required
          minLength={8}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <p className="text-xs text-muted-foreground">At least 8 characters.</p>
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <Button type="submit" disabled={sendingCode} className="w-full rounded-full">
        {sendingCode && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Send verification code
      </Button>
    </form>
  );
}

// Two-step: send a reset code to the email, then confirm the code + new
// password. Deliberately doesn't reveal whether the email has an account —
// same message either way — so it can't be used to enumerate customers.
function ForgotPasswordForm({ onDone }) {
  const { sendOtp, resetPassword } = useCustomerAuth();
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [step, setStep] = useState("email"); // "email" | "code" | "done"
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [resendIn, setResendIn] = useState(0);

  useEffect(() => {
    if (resendIn <= 0) return undefined;
    const timer = setInterval(() => setResendIn((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(timer);
  }, [resendIn]);

  async function handleSendCode(e) {
    e.preventDefault();
    setError("");
    setSending(true);
    try {
      await sendOtp(email, "reset");
      setStep("code");
      setResendIn(30);
    } catch (err) {
      setError(err.message || "Could not send the reset code");
    } finally {
      setSending(false);
    }
  }

  async function handleResend() {
    setError("");
    try {
      await sendOtp(email, "reset");
      setResendIn(30);
    } catch (err) {
      setError(err.message || "Could not resend the code");
    }
  }

  async function handleReset(e) {
    e.preventDefault();
    setError("");
    if (otp.length !== 6) {
      setError("Enter the 6-digit code");
      return;
    }
    setSubmitting(true);
    try {
      await resetPassword({ email, otp, newPassword });
      setStep("done");
    } catch (err) {
      setError(err.message || "Could not reset your password");
    } finally {
      setSubmitting(false);
    }
  }

  if (step === "done") {
    return (
      <div className="space-y-4 py-2 text-center text-sm">
        <p className="text-foreground">Your password has been reset.</p>
        <p className="text-muted-foreground">You've been signed out everywhere for safety — log in with your new password.</p>
        <Button onClick={onDone} className="w-full rounded-full">
          Back to log in
        </Button>
      </div>
    );
  }

  if (step === "code") {
    return (
      <form onSubmit={handleReset} className="space-y-4">
        <p className="text-sm text-muted-foreground">
          If <strong className="text-foreground">{email}</strong> has an account, we sent it a 6-digit code.
        </p>
        <div className="flex justify-center">
          <InputOTP maxLength={6} value={otp} onChange={setOtp}>
            <InputOTPGroup>
              <InputOTPSlot index={0} />
              <InputOTPSlot index={1} />
              <InputOTPSlot index={2} />
              <InputOTPSlot index={3} />
              <InputOTPSlot index={4} />
              <InputOTPSlot index={5} />
            </InputOTPGroup>
          </InputOTP>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="reset-password">New password</Label>
          <Input
            id="reset-password"
            type="password"
            required
            minLength={8}
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
          />
        </div>
        {error && <p className="text-center text-sm text-destructive">{error}</p>}
        <Button type="submit" disabled={submitting} className="w-full rounded-full">
          {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Reset password
        </Button>
        <div className="text-center text-sm text-muted-foreground">
          {resendIn > 0 ? (
            <span>Resend code in {resendIn}s</span>
          ) : (
            <button type="button" onClick={handleResend} className="text-primary underline underline-offset-2">
              Resend code
            </button>
          )}
        </div>
      </form>
    );
  }

  return (
    <form onSubmit={handleSendCode} className="space-y-3">
      <div className="space-y-1.5">
        <Label htmlFor="forgot-email">Email</Label>
        <Input id="forgot-email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <Button type="submit" disabled={sending} className="w-full rounded-full">
        {sending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Send reset code
      </Button>
      <button type="button" onClick={onDone} className="w-full text-center text-sm text-muted-foreground underline underline-offset-2">
        Back to log in
      </button>
    </form>
  );
}

// Renders Google's own "Continue with Google" button via Google Identity
// Services. Silently renders nothing if VITE_GOOGLE_CLIENT_ID isn't set,
// rather than showing a broken button.
function GoogleButton({ onSuccess }) {
  const { loginWithGoogle } = useCustomerAuth();
  const containerRef = useRef(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!GOOGLE_CLIENT_ID || !containerRef.current) return undefined;

    let cancelled = false;

    function handleCredential(response) {
      loginWithGoogle(response.credential)
        .then(() => {
          if (!cancelled) onSuccess();
        })
        .catch((err) => {
          if (!cancelled) setError(err.message || "Google sign-in failed");
        });
    }

    function render() {
      if (cancelled || !window.google?.accounts?.id || !containerRef.current) return;
      window.google.accounts.id.initialize({ client_id: GOOGLE_CLIENT_ID, callback: handleCredential });
      containerRef.current.innerHTML = "";
      window.google.accounts.id.renderButton(containerRef.current, {
        theme: "outline",
        size: "large",
        width: 320,
        text: "continue_with",
      });
    }

    const existing = document.getElementById("google-identity-script");
    if (existing) {
      render();
    } else {
      const script = document.createElement("script");
      script.id = "google-identity-script";
      script.src = "https://accounts.google.com/gsi/client";
      script.async = true;
      script.defer = true;
      script.onload = render;
      document.head.appendChild(script);
    }

    return () => {
      cancelled = true;
    };
  }, [loginWithGoogle, onSuccess]);

  if (!GOOGLE_CLIENT_ID) return null;

  return (
    <div className="mt-4 border-t border-border pt-4">
      <div className="mb-2 text-center text-xs uppercase tracking-wide text-muted-foreground">or</div>
      <div ref={containerRef} className="flex justify-center" />
      {error && <p className="mt-2 text-center text-sm text-destructive">{error}</p>}
    </div>
  );
}

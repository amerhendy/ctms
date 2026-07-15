import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null, copied: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ error, errorInfo });
    console.error("ErrorBoundary caught an error:", error, errorInfo);
    
    // هنا تقدر تحط الـ fetch الخاص بالـ Auto-Logging لو حابب تسجله في الـ DB
  }

  handleCopyError = () => {
    const errorDetails = `📍 URL: ${window.location.href}\n📅 Date: ${new Date().toLocaleString()}\n❌ Error: ${this.state.error?.toString()}\n💻 Stack: ${this.state.errorInfo?.componentStack}`;
    navigator.clipboard.writeText(errorDetails).then(() => {
      this.setState({ copied: true });
      setTimeout(() => this.setState({ copied: false }), 3000);
    });
  };

  handleSendEmail = () => {
    const adminEmail = "admin@yourdomain.com"; 
    const currentUrl = window.location.href;   
    const errorString = this.state.error ? this.state.error.toString() : "Unknown Error";
    const componentStack = this.state.errorInfo ? this.state.errorInfo.componentStack : "";

    const subject = encodeURIComponent("⚠️ تقرير خطأ في النظام");
    const body = encodeURIComponent(
      `مرحباً بالدعم الفني،\n\n` +
      `📍 رابط الصفحة: ${currentUrl}\n` +
      `📅 وقت الحدوث: ${new Date().toLocaleString('ar-EG')}\n` +
      `❌ تفاصيل الخطأ:\n${errorString}\n\n` +
      `💻 مكان الخطأ:\n${componentStack.slice(0, 500)}...`
    );

    window.location.href = `mailto:${adminEmail}?subject=${subject}&body=${body}`;
  };

  render() {
    if (this.state.hasError) {
      // تحديد نوع الرسالة بناءً على الخطأ
      const isNetworkError = this.state.error?.toString().toLowerCase().includes('network') || !navigator.onLine;

      return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] p-6 bg-gray-50/50 rounded-xl border border-gray-100 dir-rtl">
          
          <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-4 animate-pulse">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
            </svg>
          </div>

          <h2 className="text-xl font-bold text-gray-800 mb-2 text-center">
            {isNetworkError ? "مشكلة في الاتصال بالشبكة" : "عذراً، واجهنا مشكلة في تحميل هذه الصفحة"}
          </h2>
          
          <p className="text-gray-500 text-sm mb-6 text-center max-w-md leading-relaxed">
            {isNetworkError 
              ? "يرجى التحقق من اتصال الإنترنت لديك ثم إعادة المحاولة."
              : "حدث خطأ غير متوقع في النظام الداخلي. يمكنك تحديث الصفحة أو نسخ تفاصيل الخطأ وإرسالها لمدير النظام لحلها فوراً."
            }
          </p>

          <div className="flex flex-wrap gap-3 justify-center items-center mb-6">
            <button
              onClick={() => window.location.reload()}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm rounded-lg shadow-sm transition-all flex items-center gap-2"
            >
              تحديث الصفحة
            </button>

            <button
              onClick={this.handleCopyError}
              className={`px-5 py-2.5 font-medium text-sm rounded-lg shadow-sm transition-all flex items-center gap-2 ${
                this.state.copied ? 'bg-green-600 text-white' : 'bg-amber-500 hover:bg-amber-600 text-white'
              }`}
            >
              {this.state.copied ? "✓ تم النسخ" : "نسخ تفاصيل الخطأ"}
            </button>

            {!isNetworkError && (
              <button
                onClick={this.handleSendEmail}
                className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white font-medium text-sm rounded-lg shadow-sm transition-all"
              >
                إرسال بالإيميل
              </button>
            )}
            
            <a
              href="/dashboard"
              className="px-5 py-2.5 bg-white hover:bg-gray-50 text-gray-700 font-medium text-sm rounded-lg border border-gray-200 transition-all"
            >
              العودة للرئيسية
            </a>
          </div>

          {this.state.error && (
            <details className="w-full max-w-2xl mt-4 bg-gray-900 text-left text-xs font-mono text-gray-300 rounded-lg overflow-hidden border border-gray-800">
              <summary className="bg-gray-800 text-gray-400 px-4 py-2 cursor-pointer select-none font-sans text-right dir-rtl">
                ⚙️ تفاصيل الخطأ الفنية (خاص بمدير النظام)
              </summary>
              <div className="p-4 overflow-x-auto max-h-40 leading-normal">
                <p className="text-red-400 font-bold mb-1">{this.state.error.toString()}</p>
                <p className="whitespace-pre-wrap text-gray-400">{this.state.errorInfo?.componentStack}</p>
              </div>
            </details>
          )}

        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
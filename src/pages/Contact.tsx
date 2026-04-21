import { useState } from 'react'
import { Mail, Handshake, Heart, Send, CheckCircle } from 'lucide-react'

type InquiryType = 'partner' | 'sponsor' | 'general'

export default function Contact() {
  const [type, setType] = useState<InquiryType>('partner')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // In production, this would send to an API
    setSubmitted(true)
    setTimeout(() => {
      setSubmitted(false)
      setName('')
      setEmail('')
      setMessage('')
    }, 4000)
  }

  const typeOptions = [
    { value: 'partner' as const, label: 'Partnership', icon: Handshake, desc: 'Join us as a technology or deployment partner' },
    { value: 'sponsor' as const, label: 'Sponsorship', icon: Heart, desc: 'Support our ocean cleanup mission' },
    { value: 'general' as const, label: 'General Inquiry', icon: Mail, desc: 'Questions, feedback, or collaboration ideas' },
  ]

  return (
    <div className="p-6 flex flex-col gap-6 max-w-2xl mx-auto w-full">
      <div>
        <h1 className="text-xl font-bold text-slate-800">Contact Us</h1>
        <p className="text-slate-400 text-sm mt-0.5">
          Interested in partnering with SeaTong or sponsoring our ocean cleanup initiative?
        </p>
      </div>

      {/* Inquiry type selector */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {typeOptions.map((opt) => (
          <button
            key={opt.value}
            onClick={() => setType(opt.value)}
            className={`p-4 rounded-xl border text-left transition-all ${
              type === opt.value
                ? 'bg-teal-50 border-teal-300 shadow-sm'
                : 'bg-white border-slate-200 hover:border-teal-200'
            }`}
          >
            <opt.icon size={20} className={type === opt.value ? 'text-teal-500' : 'text-slate-300'} />
            <div className={`text-sm font-semibold mt-2 ${type === opt.value ? 'text-teal-700' : 'text-slate-600'}`}>
              {opt.label}
            </div>
            <div className="text-xs text-slate-400 mt-0.5">{opt.desc}</div>
          </button>
        ))}
      </div>

      {/* Contact form */}
      <form onSubmit={handleSubmit} className="bg-white border border-teal-200 rounded-xl p-6 shadow-sm flex flex-col gap-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-sm text-slate-500 mb-1 block">Name</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm text-slate-700 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent"
            />
          </div>
          <div>
            <label className="text-sm text-slate-500 mb-1 block">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="[email]"
              className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm text-slate-700 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent"
            />
          </div>
        </div>

        <div>
          <label className="text-sm text-slate-500 mb-1 block">Organization (optional)</label>
          <input
            type="text"
            placeholder="Company or organization name"
            className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm text-slate-700 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent"
          />
        </div>

        <div>
          <label className="text-sm text-slate-500 mb-1 block">Message</label>
          <textarea
            required
            rows={4}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Tell us how you'd like to get involved..."
            className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm text-slate-700 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent resize-none"
          />
        </div>

        <button
          type="submit"
          disabled={submitted}
          className={`flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg text-sm font-medium transition-colors w-fit ${
            submitted
              ? 'bg-teal-100 text-teal-600 border border-teal-200'
              : 'bg-teal-500 text-white hover:bg-teal-600'
          }`}
        >
          {submitted ? (
            <>
              <CheckCircle size={16} />
              Message Sent
            </>
          ) : (
            <>
              <Send size={16} />
              Send Message
            </>
          )}
        </button>
      </form>

      {/* Direct email */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-sm text-slate-500">
        <div className="flex items-center gap-2 mb-1">
          <Mail size={14} className="text-teal-500" />
          <span className="font-medium text-slate-600">Reach us directly</span>
        </div>
        <p>Email us at <span className="text-teal-600 font-medium">[email]</span> for partnership or sponsorship inquiries.</p>
      </div>
    </div>
  )
}

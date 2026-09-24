const testimonials=[
  {name:"Ayesha Khan",location:"Lahore",text:"The booking process was simple, the room information was clear, and everything felt easy to manage."},
  {name:"Hamza Ahmed",location:"Islamabad",text:"I could compare rooms, check availability and keep track of my booking from one place."},
  {name:"Sara Malik",location:"Karachi",text:"QuickStay made it easy to find a comfortable stay and complete the booking without confusion."}
];

export default function Testimonials(){
  return <section className="bg-gray-50 py-16 sm:py-20"><div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
    <div className="mx-auto max-w-2xl text-center"><p className="text-sm font-semibold uppercase tracking-wider text-primary">Guest experiences</p><h2 className="mt-2 text-3xl font-bold text-gray-900">What our guests say</h2><p className="mt-3 text-gray-500">Simple booking, comfortable stays and a smoother way to plan your next trip.</p></div>
    <div className="mt-10 grid gap-6 md:grid-cols-3">{testimonials.map(t=><article key={t.name} className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm"><div className="flex items-center gap-1 text-amber-400" aria-label="5 out of 5 stars">★★★★★</div><p className="mt-5 leading-7 text-gray-600">“{t.text}”</p><div className="mt-6 border-t pt-5"><p className="font-semibold text-gray-900">{t.name}</p><p className="mt-1 text-sm text-gray-500">{t.location}</p></div></article>)}</div>
  </div></section>;
}

'use client';

import Image from 'next/image';
import Link from 'next/link';

interface Service {
  id: string;
  name: string;
  price: string;
  description: string;
  image: string;
}

interface ServiceSectionProps {
  title: string;
  services: Service[];
}

const bridalServices: Service[] = [
  {
    id: 'bridal',
    name: 'Bridal makeup',
    price: '$200.00',
    description: 'Achieve a flawless, long-lasting look that enhances your natural beauty on your special day. Customized to match your wedding style, ensuring you feel confident and camera-ready.',
    image: '/images/image.webp'
  },
  {
    id: 'bridal-trial',
    name: 'Bridal trial makeup',
    price: '$150.00',
    description: 'Test and refine your dream wedding day look with a trial session tailored to your preferences. Perfect for ensuring everything is flawless on the big day.',
    image: '/images/image (1).webp'
  },
  {
    id: 'bridesmaid',
    name: 'Bridesmaid or attendant makeup',
    price: '$100.00',
    description: "Ensure your bridal party looks cohesive and elegant with professionally applied makeup. Customized to each individual's style and the wedding theme.",
    image: '/images/image (2).webp'
  }
];

const specialOccasionServices: Service[] = [
  {
    id: 'special-occasion',
    name: 'Special occasion makeup',
    price: '$60.00 - $150.00',
    description: 'Look your best for proms, galas, or any memorable event with makeup tailored to the occasion. Designed to complement your outfit and enhance your unique features.',
    image: '/images/image3.webp'
  },
  {
    id: 'on-location',
    name: 'On-location makeup',
    price: '$150.00 - $250.00',
    description: 'Enjoy the convenience of professional makeup services brought directly to your location. Ideal for special events or busy schedules.',
    image: '/images/image4.webp'
  }
];

const ServiceSection = ({ title, services }: ServiceSectionProps) => (
  <section className="max-w-7xl mx-auto px-4 mb-20">
    <h2 className="text-4xl md:text-5xl font-light text-gray-800 mb-16">
      {title}
    </h2>

    <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
      {services.map((service) => (
        <div key={service.id} className="flex flex-col group">
          {/* Service Image */}
          <div className="relative aspect-[4/3] mb-6 overflow-hidden">
            <Image
              src={service.image}
              alt={service.name}
              fill
              className="object-cover transition-transform duration-700 group-hover:scale-110"
              priority
            />
            <div className="absolute inset-0 bg-black/10 group-hover:bg-black/0 transition-colors duration-300" />
          </div>

          {/* Service Details */}
          <div className="flex flex-col flex-grow">
            <div className="mb-4">
              <h3 className="text-xl font-medium text-gray-900 group-hover:text-pink-600 transition-colors duration-300">
                {service.name}
              </h3>
              <span className="text-lg text-gray-900 mt-1">
                {service.price}
              </span>
            </div>
            
            <p className="text-gray-600 text-base leading-relaxed mb-6">
              {service.description}
            </p>

            <div className="mt-auto text-center">
              <Link
                href={`/booking?service=${service.id}`}
                className="inline-block bg-gray-100 text-gray-900 text-center py-3 px-8 hover:bg-pink-600 hover:text-white transition-all duration-300"
              >
                {service.id === 'on-location' ? 'Quick quotation' : 'Book a service'}
              </Link>
            </div>
          </div>
        </div>
      ))}
    </div>
  </section>
);

export default function Services() {
  return (
    <main className="min-h-screen bg-white py-20">
      <ServiceSection title="Bridal & wedding" services={bridalServices} />
      <ServiceSection title="Special occasion" services={specialOccasionServices} />
    </main>
  );
} 
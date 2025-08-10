"use client";

import { useState } from "react";
import portfolioData from "../data/portfolio-data.json";

interface ItemCardProps {
  item: any;
  onClick: () => void;
}

function ItemCard({ item, onClick }: ItemCardProps) {
  return (
    <div
      onClick={onClick}
      className="group cursor-pointer transition-all duration-300 hover:scale-[1.02]"
    >
      {/* Thumbnail/Photo */}
      <div className="relative mb-3 rounded-lg overflow-hidden bg-gradient-to-br from-white to-white aspect-video">
        <div className="absolute inset-0 bg-gradient-to-br from-white to-white" />
        <div className="absolute inset-0 flex items-center justify-center">
          {item.image ? (
            <img
              src={item.image}
              alt={`${item.company || item.organization || item.name} image`}
              className="w-full h-full object-cover"
            />
          ) : item.logo ? (
            <img
              src={item.logo}
              alt={`${item.company || item.organization || item.name} logo`}
              className="w-16 h-16 object-contain"
            />
          ) : (
            <div className="text-4xl text-white">💼</div>
          )}
        </div>

        {/* Duration/Period Badge */}
        <div className="absolute bottom-2 right-2 bg-black/80 text-white text-xs px-2 py-1 rounded">
          {item.period}
        </div>
      </div>

      {/* Title */}
      <h3 className="font-semibold text-gray-900 dark:text-white text-sm mb-1 line-clamp-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
        {item.company || item.organization || item.name}
      </h3>

      {/* Role/Subtitle */}
      <p className="text-gray-600 dark:text-gray-400 text-xs mb-2">
        {item.role}
      </p>

      {/* Brief Description */}
      <p className="text-gray-500 dark:text-gray-500 text-xs line-clamp-2 mb-2">
        {item.description}
      </p>

      {/* Technologies/Achievements */}
      <div className="flex flex-wrap gap-1">
        {item.technologies &&
          item.technologies.slice(0, 2).map((tech: string, index: number) => (
            <span
              key={index}
              className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs rounded-full"
            >
              {tech}
            </span>
          ))}
        {item.achievements &&
          item.achievements
            .slice(0, 1)
            .map((achievement: string, index: number) => (
              <span
                key={index}
                className="px-2 py-1 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 text-xs rounded-full"
              >
                {achievement}
              </span>
            ))}
      </div>
    </div>
  );
}

interface SectionProps {
  title: string;
  items: any[];
  onItemClick: (item: any) => void;
}

function Section({ title, items, onItemClick }: SectionProps) {
  return (
    <section className="mb-12">
      {/* Section Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          {title}
        </h2>
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {items.map((item, index) => (
          <ItemCard key={index} item={item} onClick={() => onItemClick(item)} />
        ))}
      </div>
    </section>
  );
}

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: any;
}

import { useEffect } from "react";

function Modal({ isOpen, onClose, item }: ModalProps) {
  // Prevent background scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  if (!isOpen || !item) return null;

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50"
      onClick={onClose} // Close on backdrop click
    >
      <div
        className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside
      >
        <div className="relative">
          {/* Hero Image */}
          <div className="h-48 bg-gradient-to-r from-white to-white rounded-t-xl relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-white to-white" />
            <div className="absolute inset-0 flex items-center justify-center">
              {item.logo ? (
                <img
                  src={item.logo}
                  alt={`${item.company || item.organization || item.name} image`}
                  className="w-full h-full object-cover"
                />
              ) : item.image ? (
                <img
                  src={item.image}
                  alt={`${item.company || item.organization || item.name} logo`}
                  className="w-16 h-16 object-contain"
                />
              ) : (
                <div className="text-4xl text-white">💼</div>
              )}
            </div>
          </div>

          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 bg-black/50 backdrop-blur-sm rounded-full flex items-center justify-center text-white text-lg hover:bg-black/70 transition-colors"
          >
            ×
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              {item.company || item.organization || item.name}
            </h2>
            <p className="text-blue-600 dark:text-blue-400 font-medium mb-2">
              {item.role}
            </p>
            <span className="inline-block px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-full text-sm">
              {item.period}
            </span>
          </div>

          <div className="space-y-6">
            <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
              {item.description}
            </p>

            {item.details && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                  Key Details
                </h3>
                <ul className="space-y-2">
                  {item.details.map((detail: string, index: number) => (
                    <li
                      key={index}
                      className="flex items-start space-x-2 text-gray-600 dark:text-gray-300"
                    >
                      <span className="text-blue-500 mt-1">•</span>
                      <span className="leading-relaxed">{detail}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {item.technologies && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                  Technologies Used
                </h3>
                <div className="flex flex-wrap gap-2">
                  {item.technologies.map((tech: string, index: number) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full text-sm"
                    >
                      {tech}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {item.achievements && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                  Key Achievements
                </h3>
                <div className="flex flex-wrap gap-2">
                  {item.achievements.map(
                    (achievement: string, index: number) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 rounded-full text-sm"
                      >
                        {achievement}
                      </span>
                    )
                  )}
                </div>
              </div>
            )}

            {item.links && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                  Links & Resources
                </h3>
                <div className="flex gap-3">
                  {Object.entries(item.links).map(([key, url]) => (
                    <a
                      key={key}
                      href={url as string}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
                    >
                      {key.charAt(0).toUpperCase() + key.slice(1)}
                    </a>
                  ))}
                </div>
              </div>
            )}

            {item.image && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                  Project Screenshot
                </h3>
                <img
                  src={item.image}
                  alt="Project screenshot"
                  className="w-full max-w-md rounded-lg shadow-md"
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}



export default function PortfolioSection() {
  const [selectedItem, setSelectedItem] = useState<any>(null);

  const handleItemClick = (item: any) => {
    setSelectedItem(item);
  };

  const handleCloseModal = () => {
    setSelectedItem(null);
  };

  return (
    <section className="py-16 bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            README.md
          </h2>
        </div>

        {/* Work Experience Section */}
        <Section
          title="Experience"
          items={portfolioData.experience.details.items}
          onItemClick={handleItemClick}
        />

        {/* Leadership Section */}
        <Section
          title="Leadership"
          items={portfolioData.leadership.details.items}
          onItemClick={handleItemClick}
        />

        {/* Projects Section */}
        <Section
          title="Featured Projects"
          items={portfolioData.projects.details.items}
          onItemClick={handleItemClick}
        />

        {/* Skills Section */}
        <section className="mb-12">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Skills
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {portfolioData.skills.details.categories.map(
              (category: any, index: number) => (
                <div
                  key={index}
                  className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 p-4"
                >
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
                    {category.name}
                  </h3>
                  <div className="flex flex-wrap gap-1">
                    {category.skills.map(
                      (skill: string, skillIndex: number) => (
                        <span
                          key={skillIndex}
                          className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded text-xs"
                        >
                          {skill}
                        </span>
                      )
                    )}
                  </div>
                </div>
              )
            )}
          </div>

          <div className="mt-6 bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 p-4">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
              Certifications
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {portfolioData.skills.details.certifications.map(
                (cert: string, index: number) => (
                  <div
                    key={index}
                    className="flex items-center space-x-2 text-gray-600 dark:text-gray-300 text-sm"
                  >
                    <span className="text-green-500">✓</span>
                    <span>{cert}</span>
                  </div>
                )
              )}
            </div>
          </div>
        </section>

        {/* Contact Section */}
        <section className="mb-12">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Connect
            </h2>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-start space-x-6">
              {/* Profile Photo */}
              <div className="flex-shrink-0">
                <img
                  src="/sachin-image-cropped.png"
                  alt="Sachin Ved Gupta"
                  className="w-20 h-20 rounded-full object-cover border-2 border-gray-200 dark:border-gray-600"
                />
              </div>

              {/* Contact Info */}
              <div className="flex-1">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                      Contact Information
                    </h3>
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <span className="text-gray-500">📧</span>
                        <a
                          href={`mailto:${portfolioData.contact.details.email}`}
                          className="text-blue-600 dark:text-blue-400 hover:underline text-sm"
                        >
                          {portfolioData.contact.details.email}
                        </a>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-gray-500">📄</span>
                        <a
                          href={portfolioData.contact.details.resume}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 dark:text-blue-400 hover:underline text-sm"
                        >
                          Download Resume
                        </a>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                      Social Links
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(portfolioData.contact.details.social).map(
                        ([platform, url]) => (
                          <a
                            key={platform}
                            href={url as string}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-3 py-1 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 rounded text-xs font-medium transition-colors"
                          >
                            {platform.charAt(0).toUpperCase() +
                              platform.slice(1)}
                          </a>
                        )
                      )}
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <p className="text-gray-600 dark:text-gray-300 italic text-sm">
                    {portfolioData.contact.details.message}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <Modal
          isOpen={selectedItem !== null}
          onClose={handleCloseModal}
          item={selectedItem}
        />
      </div>
    </section>
  );
}

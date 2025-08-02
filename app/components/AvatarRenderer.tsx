"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

export default function AvatarRenderer() {
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const modelRef = useRef<THREE.Group | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [lastMouseX, setLastMouseX] = useState(0);
  const [rotationY, setRotationY] = useState(0);
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);
  const [displayedText, setDisplayedText] = useState("");
  const [isTyping, setIsTyping] = useState(false);

  const messages = [
    "I am a **Machine Learning Engineer** with expertise in **Python**, **TensorFlow**, and **PyTorch**.",
    "I love building **AI systems** and **neural networks** for computer vision and NLP applications.",
    "Passionate about **computer vision**, **deep learning**, and **MLOps** - always exploring new technologies.",
    "Experienced in **software engineering**, **data science**, and **cloud platforms** like AWS and GCP.",
    "Let's build something amazing together! Check out my **GitHub** and **LinkedIn** for more projects.",
  ];

  const formatMessage = (text: string) => {
    return text
      .replace(
        /\*\*(.*?)\*\*/g,
        '<strong class="text-blue-600 dark:text-blue-400">$1</strong>'
      )
      .replace(
        /GitHub/g,
        '<a href="https://github.com/yourusername" target="_blank" rel="noopener noreferrer" class="text-blue-600 dark:text-blue-400 hover:underline font-medium">GitHub</a>'
      )
      .replace(
        /LinkedIn/g,
        '<a href="https://linkedin.com/in/yourusername" target="_blank" rel="noopener noreferrer" class="text-blue-600 dark:text-blue-400 hover:underline font-medium">LinkedIn</a>'
      );
  };

  const typeMessage = (message: string) => {
    setIsTyping(true);
    setDisplayedText("");
    let index = 0;

    const typeInterval = setInterval(() => {
      if (index < message.length) {
        setDisplayedText((prev) => prev + message[index]);
        index++;
      } else {
        setIsTyping(false);
        clearInterval(typeInterval);
      }
    }, 50);
  };

  useEffect(() => {
    if (!mountRef.current) return;

    // Scene setup
    const scene = new THREE.Scene();
    scene.background = null; // Transparent background
    sceneRef.current = scene;

    // Camera setup - adjusted for better framing
    const camera = new THREE.PerspectiveCamera(
      50, // Adjusted FOV
      mountRef.current.clientWidth / mountRef.current.clientHeight,
      0.1,
      1000
    );
    camera.position.set(0, 0, 5); // Moved camera further back

    // Renderer setup
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true, // Enable transparency
    });
    renderer.setSize(
      mountRef.current.clientWidth,
      mountRef.current.clientHeight
    );
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    rendererRef.current = renderer;

    // Enhanced lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.9);
    directionalLight.position.set(5, 5, 5);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    scene.add(directionalLight);

    // Additional fill light
    const fillLight = new THREE.DirectionalLight(0xffffff, 0.5);
    fillLight.position.set(-5, 0, 5);
    scene.add(fillLight);

    // Load avatar
    const loader = new GLTFLoader();
    loader.load(
      "/my_avatar_king.glb",
      (gltf) => {
        const model = gltf.scene;
        modelRef.current = model;

        // Center the model
        const box = new THREE.Box3().setFromObject(model);
        const center = box.getCenter(new THREE.Vector3());
        model.position.sub(center);

        // Scale the model to fit properly without cutoff
        const size = box.getSize(new THREE.Vector3());
        const maxDim = Math.max(size.x, size.y, size.z);
        const scale = 1.5 / maxDim; // Reduced scale to prevent cutoff
        model.scale.setScalar(scale);

        // Position the avatar to show full head
        model.position.y = -0.3;

        // Enable shadows for all meshes
        model.traverse((child) => {
          if (child instanceof THREE.Mesh) {
            child.castShadow = true;
            child.receiveShadow = true;
          }
        });

        scene.add(model);
      },
      (progress) => {
        console.log(
          "Loading progress:",
          (progress.loaded / progress.total) * 100,
          "%"
        );
      },
      (error) => {
        console.error("Error loading avatar:", error);
      }
    );

    // Animation loop
    const animate = () => {
      requestAnimationFrame(animate);

      // Apply rotation to the model
      if (modelRef.current) {
        modelRef.current.rotation.y = rotationY;
      }

      renderer.render(scene, camera);
    };
    animate();

    // Handle resize
    const handleResize = () => {
      if (!mountRef.current) return;

      const width = mountRef.current.clientWidth;
      const height = mountRef.current.clientHeight;

      camera.aspect = width / height;
      camera.updateProjectionMatrix();

      renderer.setSize(width, height);
    };

    window.addEventListener("resize", handleResize);

    // Mount renderer
    mountRef.current.appendChild(renderer.domElement);

    // Cleanup
    return () => {
      window.removeEventListener("resize", handleResize);
      if (mountRef.current && renderer.domElement) {
        mountRef.current.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, [rotationY]);

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    setLastMouseX(e.clientX);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;

    const deltaX = e.clientX - lastMouseX;
    const rotationSpeed = 0.003; // Very smooth rotation

    setRotationY((prev) => prev + deltaX * rotationSpeed);
    setLastMouseX(e.clientX);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleMouseLeave = () => {
    setIsDragging(false);
  };

  const handleAvatarClick = () => {
    if (!isTyping) {
      const nextIndex = (currentMessageIndex + 1) % messages.length;
      setCurrentMessageIndex(nextIndex);
      typeMessage(messages[nextIndex]);
    }
  };

  return (
    <div className="relative bg-transparent rounded-lg overflow-hidden">
      <div className="mb-4 text-center">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
          👑 Interactive Avatar
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-300">
          Click and drag to rotate • Click to hear me speak
        </p>
      </div>

      <div
        ref={mountRef}
        className="w-full h-80 sm:h-96 md:h-[450px] lg:h-[500px] xl:h-[550px] bg-transparent rounded-lg overflow-hidden cursor-grab active:cursor-grabbing select-none"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
        onClick={handleAvatarClick}
        style={{
          minHeight: "300px",
          maxHeight: "600px",
        }}
      />

      {/* Animated Text Box */}
      <div className="mt-6 p-4 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0">
            <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
              <span className="text-white text-sm font-bold">👑</span>
            </div>
          </div>
          <div className="flex-1 min-h-0">
            <div className="text-sm font-medium text-gray-900 dark:text-white mb-1">
              Avatar
            </div>
            <div
              className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed"
              dangerouslySetInnerHTML={{
                __html:
                  formatMessage(displayedText) +
                  (isTyping
                    ? '<span class="inline-block w-2 h-4 bg-blue-500 ml-1 animate-pulse"></span>'
                    : ""),
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

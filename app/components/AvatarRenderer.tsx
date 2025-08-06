"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

export default function AvatarRenderer() {
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const modelRef = useRef<THREE.Group | null>(null);
  const animationIdRef = useRef<number | null>(null);
  const rotationYRef = useRef(0); // Use ref instead of state for smooth updates
  const typingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const [isDragging, setIsDragging] = useState(false);
  const [lastMouseX, setLastMouseX] = useState(0);
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);
  const [displayedText, setDisplayedText] = useState("");
  const [isTyping, setIsTyping] = useState(false);

  const messages = [
    "i love creating ai systems that help people and impact lives",
    "i am a machine learning intern @ shopify @ nokia",
    "i lead drone club's ml team to autonomously put out wild fires",
    "i am developing a browser ai agent that can do anything for you",
    "i am honing my skills within llm research, ai agents, and cv models",
    "i am looking for ml and swe internships for winter/spring 2026 and summer 2026",
    "i am a software engineering student @ mcmaster university, graduating in 2027",
    "i am a builder, click me to learn more or scroll down to ask my ai persona and view the allocating rag embeddings visualization",
  ];

  const updateHeaderText = (text: string) => {
    const headerElement = document.getElementById("avatar-text");
    if (headerElement) {
      headerElement.innerHTML = `<div class="text-sm text-gray-600 dark:text-gray-400">${text}</div>`;
    }
  };

  const typeMessage = (message: string) => {
    // Clear any existing interval
    if (typingIntervalRef.current) {
      clearInterval(typingIntervalRef.current);
    }

    setIsTyping(true);
    setDisplayedText("");
    let index = 0;

    typingIntervalRef.current = setInterval(() => {
      if (index < message.length) {
        const currentText = message.substring(0, index + 1);
        setDisplayedText(currentText);
        updateHeaderText(currentText);
        index++;
      } else {
        setIsTyping(false);
        if (typingIntervalRef.current) {
          clearInterval(typingIntervalRef.current);
          typingIntervalRef.current = null;
        }
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
      60, // Increased FOV to show more of the avatar
      mountRef.current.clientWidth / mountRef.current.clientHeight,
      0.1,
      1000
    );
    camera.position.set(0, 0, 4); // Moved camera closer
    cameraRef.current = camera;

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

        // Scale the model to be much larger
        const size = box.getSize(new THREE.Vector3());
        const maxDim = Math.max(size.x, size.y, size.z);
        const scale = 3.5 / maxDim; // Adjusted scale
        model.scale.setScalar(scale);

        // Position the avatar to show full head and reduce bottom space
        model.position.y = -1.7; // Adjusted position

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

    // Animation loop - moved outside and using refs
    const animate = () => {
      if (modelRef.current) {
        modelRef.current.rotation.y = rotationYRef.current;
      }

      if (rendererRef.current && sceneRef.current && cameraRef.current) {
        rendererRef.current.render(sceneRef.current, cameraRef.current);
      }

      animationIdRef.current = requestAnimationFrame(animate);
    };
    animate();

    // Handle resize
    const handleResize = () => {
      if (!mountRef.current || !cameraRef.current || !rendererRef.current)
        return;

      const width = mountRef.current.clientWidth;
      const height = mountRef.current.clientHeight;

      cameraRef.current.aspect = width / height;
      cameraRef.current.updateProjectionMatrix();

      rendererRef.current.setSize(width, height);
    };

    window.addEventListener("resize", handleResize);

    // Mount renderer
    mountRef.current.appendChild(renderer.domElement);

    // Cleanup
    return () => {
      window.removeEventListener("resize", handleResize);
      if (animationIdRef.current) {
        cancelAnimationFrame(animationIdRef.current);
      }
      if (mountRef.current && renderer.domElement) {
        mountRef.current.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, []); // Remove rotationY dependency

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    setLastMouseX(e.clientX);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;

    const deltaX = e.clientX - lastMouseX;
    const rotationSpeed = 0.005; // Slightly increased for more responsiveness

    // Update the ref directly for smooth rotation
    rotationYRef.current += deltaX * rotationSpeed;
    setLastMouseX(e.clientX);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleMouseLeave = () => {
    setIsDragging(false);
  };

  const handleAvatarClick = () => {
    if (!isDragging) {
      // Prevent click when dragging
      if (isTyping) {
        // Skip typing animation and show full message immediately
        const currentMessage = messages[currentMessageIndex];
        setDisplayedText(currentMessage);
        updateHeaderText(currentMessage);
        setIsTyping(false);
        // Clear the typing interval
        if (typingIntervalRef.current) {
          clearInterval(typingIntervalRef.current);
          typingIntervalRef.current = null;
        }
      } else {
        // Start new message
        const nextIndex = (currentMessageIndex + 1) % messages.length;
        setCurrentMessageIndex(nextIndex);
        typeMessage(messages[nextIndex]);
      }
    }
  };

  return (
    <div className="relative bg-transparent rounded-lg overflow-hidden">
      <div
        ref={mountRef}
        className="w-full h-96 sm:h-[500px] md:h-[600px] lg:h-[700px] xl:h-[800px] bg-transparent rounded-lg overflow-hidden cursor-grab active:cursor-grabbing select-none"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
        onClick={handleAvatarClick}
        style={{
          minHeight: "400px",
          maxHeight: "900px",
        }}
      />
    </div>
  );
}

import React, { useEffect, useRef } from 'react'; // ИСПРАВЛЕНИЕ: Синтаксис import исправлен
import * as THREE from 'three';
import StopIcon from '@mui/icons-material/Stop';
import styles from './RecordingOrb.module.css';
import { gsap } from 'gsap';
import micIconTextureSrc from '../assets/mic-icon.png';

// --- ШЕЙДЕРЫ ДЛЯ СФЕРЫ (Без изменений) ---
const sphereVertexShader = `
  uniform float uTime;
  uniform float uAmplitude;
  varying vec3 vNormal;
  varying vec3 vPosition;
  
  // ... (код шума Перлина, как и раньше)
  vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec4 permute(vec4 x) { return mod289(((x*34.0)+1.0)*x); }
  vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }
  float snoise(vec3 v) { 
    const vec2 C = vec2(1.0/6.0, 1.0/3.0) ;
    const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
    vec3 i  = floor(v + dot(v, C.yyy) );
    vec3 x0 =   v - i + dot(i, C.xxx) ;
    vec3 g = step(x0.yzx, x0.xyz);
    vec3 l = 1.0 - g;
    vec3 i1 = min( g.xyz, l.zxy );
    vec3 i2 = max( g.xyz, l.zxy );
    vec3 x1 = x0 - i1 + C.xxx;
    vec3 x2 = x0 - i2 + C.yyy;
    vec3 x3 = x0 - D.yyy;
    i = mod289(i); 
    vec4 p = permute( permute( i.z + vec4(0.0, i1.z, i2.z, 1.0 ))
    + i.y + vec4(0.0, i1.y, i2.y, 1.0 )) 
    + i.x + vec4(0.0, i1.x, i2.x, 1.0 );
    float n_ = 0.142857142857;
    vec3  ns = n_ * D.wyz - D.xzx;
    vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
    vec4 x_ = floor(j * ns.z);
    vec4 y_ = floor(j - 7.0 * x_);
    vec4 x = x_ *ns.x + ns.yyyy;
    vec4 y = y_ *ns.x + ns.yyyy;
    vec4 h = 1.0 - abs(x) - abs(y);
    vec4 b0 = vec4( x.xy, y.xy );
    vec4 b1 = vec4( x.zw, y.zw );
    vec4 s0 = floor(b0)*2.0 + 1.0;
    vec4 s1 = floor(b1)*2.0 + 1.0;
    vec4 sh = -step(h, vec4(0.0));
    vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy ;
    vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww ;
    vec3 p0 = vec3(a0.xy,h.x);
    vec3 p1 = vec3(a0.zw,h.y);
    vec3 p2 = vec3(a1.xy,h.z);
    vec3 p3 = vec3(a1.zw,h.w);
    vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2,p2), dot(p3,p3)));
    p0 *= norm.x;
    p1 *= norm.y;
    p2 *= norm.z;
    p3 *= norm.w;
    vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
    m = m * m;
    return 42.0 * dot( m*m, vec4( dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3) ) );
  }

  void main() {
    vNormal = normalize(normalMatrix * normal);
    float noise = snoise(position * 1.5 + uTime * 0.2);
    float fastNoise = snoise(position * 3.0 + uTime * 0.5);
    float displacement = (noise + fastNoise) * 0.1;
    displacement += uAmplitude * (noise + 0.5) * 0.4;
    vec3 newPosition = position + normal * displacement;
    vPosition = (modelViewMatrix * vec4(newPosition, 1.0)).xyz;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(newPosition, 1.0);
  }
`;

const sphereFragmentShader = `
  uniform float uTime;
  uniform float uRecording;
  uniform float uAmplitude;
  uniform vec3 uColor1;
  uniform vec3 uColor2;
  uniform vec3 uColor3;
  varying vec3 vNormal;
  varying vec3 vPosition;

  void main() {
    float wave1 = sin(dot(vNormal, vec3(1.0, 0.5, 0.2)) * 3.0 + uTime * 0.8) * 0.5 + 0.5;
    float wave2 = sin(dot(vNormal, vec3(0.2, 0.5, 1.0)) * 5.0 + uTime * 0.5) * 0.5 + 0.5;
    vec3 iridescentColor = mix(uColor1, uColor2, wave1);
    iridescentColor = mix(iridescentColor, uColor3, wave2);
    float fresnel = pow(1.0 - dot(normalize(vPosition), vNormal), 2.5);
    vec3 recordColor = vec3(1.0, 0.1, 0.1) * (1.0 + uAmplitude * 2.0);
    vec3 finalColor = mix(iridescentColor, recordColor, uRecording);
    float intensity = fresnel * 1.2 + 0.1;
    intensity += uAmplitude * uRecording * fresnel * 3.0;
    gl_FragColor = vec4(finalColor * intensity, intensity);
  }
`;

// --- НОВЫЕ ШЕЙДЕРЫ ДЛЯ ИКОНКИ ---
const iconVertexShader = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const iconFragmentShader = `
  uniform float uTime;
  uniform float uRecording;
  uniform vec3 uColor1;
  uniform vec3 uColor2;
  uniform vec3 uColor3;
  uniform sampler2D uIconTexture;
  varying vec2 vUv;

  void main() {
    // Та же логика переливающихся цветов, что и у сферы, но на основе 2D координат
    float wave1 = sin(vUv.x * 10.0 + uTime * 0.8) * 0.5 + 0.5;
    float wave2 = sin(vUv.y * 10.0 + uTime * 0.5) * 0.5 + 0.5;
    vec3 iridescentColor = mix(uColor1, uColor2, wave1);
    iridescentColor = mix(iridescentColor, uColor3, wave2);

    vec3 recordColor = vec3(1.0, 0.1, 0.1);
    vec3 finalColor = mix(iridescentColor, recordColor, uRecording);

    // Используем текстуру как маску для прозрачности
    vec4 textureColor = texture2D(uIconTexture, vUv);
    float alpha = textureColor.a; // Прозрачность берется из альфа-канала картинки

    gl_FragColor = vec4(finalColor, alpha * 0.8);
  }
`;

// --- React-компонент ---
const RecordingOrb = ({ isRecording, amplitude, onClick }) => {
  const mountRef = useRef(null);
  const uniformsRef = useRef(null);

  useEffect(() => {
    const currentMount = mountRef.current;
    if (!currentMount) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, currentMount.clientWidth / currentMount.clientHeight, 0.1, 100);
    camera.position.z = 4.5;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(currentMount.clientWidth, currentMount.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    currentMount.appendChild(renderer.domElement);
    
    uniformsRef.current = {
      uTime: { value: 0 },
      uRecording: { value: 0.0 },
      uAmplitude: { value: 0.0 },
      uColor1: { value: new THREE.Color('#6a1b9a') },
      uColor2: { value: new THREE.Color('#1565c0') },
      uColor3: { value: new THREE.Color('#00796b') },
    };

    // 1. Материал для СФЕРЫ (использует старые шейдеры)
    const sphereMaterial = new THREE.ShaderMaterial({
      vertexShader: sphereVertexShader,
      fragmentShader: sphereFragmentShader,
      uniforms: uniformsRef.current,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    const sphereGeometry = new THREE.SphereGeometry(1.2, 128, 128);
    const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
    scene.add(sphere);

    // 2. Материал для ИКОНКИ (использует новые шейдеры)
    const textureLoader = new THREE.TextureLoader();
    const micIconTexture = textureLoader.load(micIconTextureSrc);
    
    // Создаем отдельный объект uniforms для иконки, добавляя в него текстуру
    const iconUniforms = { ...uniformsRef.current, uIconTexture: { value: micIconTexture } };
    
    const iconMaterial = new THREE.ShaderMaterial({
        vertexShader: iconVertexShader,
        fragmentShader: iconFragmentShader,
        uniforms: iconUniforms,
        transparent: true,
        depthTest: false,
    });

    const iconGeometry = new THREE.PlaneGeometry(3.2, 3.2);
    const iconMesh = new THREE.Mesh(iconGeometry, iconMaterial);
    scene.add(iconMesh); // Добавляем иконку отдельно на сцену

    const clock = new THREE.Clock();
    let animationFrameId;

    const animate = () => {
      // 3. Вращаем ТОЛЬКО сферу. Иконка остается неподвижной.
      sphere.rotation.y += 0.002;
      
      uniformsRef.current.uTime.value = clock.getElapsedTime();
      renderer.render(scene, camera);
      animationFrameId = requestAnimationFrame(animate);
    };
    animate();

    const handleResize = () => {
      if(!currentMount) return;
      const width = currentMount.clientWidth;
      const height = currentMount.clientHeight;
      renderer.setSize(width, height);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      if (currentMount && renderer.domElement) {
        currentMount.removeChild(renderer.domElement);
      }
    };
  }, []);
  
  // Этот код остается без изменений
  useEffect(() => {
    if (uniformsRef.current) {
      gsap.to(uniformsRef.current.uRecording, { value: isRecording ? 1.0 : 0.0, duration: 0.7, ease: 'power2.inOut' });
    }
  }, [isRecording]);

  useEffect(() => {
    if (uniformsRef.current) {
       gsap.to(uniformsRef.current.uAmplitude, { value: amplitude, duration: 0.1, ease: 'power1.out' });
    }
  }, [amplitude]);


  return (
    <div className={styles.container} onClick={onClick}>
      {isRecording && <StopIcon className={styles.stopIcon} />}
      <div ref={mountRef} className={styles.canvasContainer}></div>
    </div>
  );
};

export default RecordingOrb;
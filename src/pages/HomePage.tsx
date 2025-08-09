import React from 'react';
import { motion, useInView, useScroll, useTransform } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useRef } from 'react';
import { 
  Award, 
  Users, 
  Trophy, 
  Star, 
  ChevronRight,
  Target,
  BookOpen,
  Heart,
  Zap,
  TrendingUp,
  Calendar,
  Medal
} from 'lucide-react';
import ParticleBackground from '../components/ParticleBackground';
import ModernBackground from '../components/ModernBackground';
import AnimatedSVGBackground from '../components/AnimatedSVGBackground';
import StatCard from '../components/StatCard';
import { fadeInUp, staggerContainer, staggerItem, scaleIn } from '../utils/animations';

const HomePage: React.FC = () => {
  const heroRef = useRef(null);
  const statsRef = useRef(null);
  const featuresRef = useRef(null);
  const achievementsRef = useRef(null);
  
  const heroInView = useInView(heroRef, { once: true });
  const statsInView = useInView(statsRef, { once: true });
  const featuresInView = useInView(featuresRef, { once: true });
  const achievementsInView = useInView(achievementsRef, { once: true });

  const { scrollYProgress } = useScroll();
  const y = useTransform(scrollYProgress, [0, 1], ['0%', '50%']);
  const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);

  const stats = [
    { 
      icon: Users, 
      value: '450+', 
      label: 'Кадетов', 
      color: 'from-blue-500 to-cyan-500',
      trend: { value: 12, isPositive: true }
    },
    { 
      icon: Trophy, 
      value: '15', 
      label: 'Побед в конкурсах', 
      color: 'from-yellow-500 to-orange-500',
      trend: { value: 25, isPositive: true }
    },
    { 
      icon: Star, 
      value: '98%', 
      label: 'Успеваемость', 
      color: 'from-green-500 to-emerald-500',
      trend: { value: 3, isPositive: true }
    },
    { 
      icon: Award, 
      value: '5', 
      label: 'Лет традиций', 
      color: 'from-purple-500 to-pink-500'
    },
  ];

  const features = [
    {
      icon: Target,
      title: 'Система рейтинга',
      description: 'Отслеживайте успехи в учёбе, дисциплине и мероприятиях',
      gradient: 'from-blue-600 to-blue-800'
    },
    {
      icon: BookOpen,
      title: 'Задания и достижения',
      description: 'Выполняйте задания, получайте баллы и награды',
      gradient: 'from-green-600 to-green-800'
    },
    {
      icon: Heart,
      title: 'Командный дух',
      description: 'Соревнуйтесь между взводами и отделениями',
      gradient: 'from-red-600 to-red-800'
    }
  ];

  const achievements = [
    {
      title: 'Лучший кадетский корпус региона',
      year: '2024',
      icon: Medal,
      color: 'from-yellow-500 to-orange-500'
    },
    {
      title: 'Победа в военно-спортивных играх',
      year: '2024',
      icon: Trophy,
      color: 'from-blue-500 to-blue-700'
    },
    {
      title: '100% поступление в вузы',
      year: '2023',
      icon: Star,
      color: 'from-green-500 to-green-700'
    }
  ];

  return (
    <main className="min-h-screen">
      {/* Hero Section */}
      <section ref={heroRef} className="relative overflow-hidden section-padding hero-bg">
        {/* Modern Particle Background */}
        <div className="absolute inset-0">
          <AnimatedSVGBackground />
        </div>
        
        {/* Overlay for better text readability */}
        <div className="absolute inset-0 bg-gradient-to-b from-slate-900/20 via-slate-900/40 to-slate-900/60 z-10"></div>
        
        <motion.div 
          className="relative container-custom z-20"
          style={{ y, opacity }}
        >
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate={heroInView ? "visible" : "hidden"}
            className="text-center"
          >
            <motion.div
              variants={scaleIn}
              className="mb-8"
            >
              <h1 className="text-7xl md:text-9xl font-display font-black mb-4 text-gradient text-glow">
                НККК
              </h1>
              <div className="w-32 h-1 bg-gradient-to-r from-blue-500 to-purple-500 mx-auto rounded-full"></div>
            </motion.div>
            
            <motion.p 
              variants={staggerItem}
              className="text-2xl md:text-3xl text-white mb-6 font-light text-shadow text-reveal"
            >
              Новороссийский казачий кадетский корпус
            </motion.p>
            
            <motion.p 
              variants={staggerItem}
              className="text-xl text-white/90 mb-16 max-w-4xl mx-auto text-shadow text-balance leading-relaxed"
            >
              Воспитание лидеров будущего через традиции, дисциплину и стремление к совершенству
            </motion.p>
            
            <motion.div
              variants={staggerItem}
              className="flex flex-col sm:flex-row gap-6 justify-center items-center"
            >
              <Link to="/rating">
                <motion.div
                  whileHover={{ scale: 1.08, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  className="btn-primary btn-lg shadow-2xl"
                >
                  Посмотреть рейтинг
                  <ChevronRight className="ml-2 h-5 w-5" />
                </motion.div>
              </Link>
              
              <Link to="/news">
                <motion.div
                  whileHover={{ scale: 1.08, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  className="btn-secondary btn-lg"
                >
                  Новости корпуса
                  <Zap className="ml-2 h-5 w-5" />
                </motion.div>
              </Link>
            </motion.div>
          </motion.div>
        </motion.div>
      </section>

      {/* Stats Section */}
      <section ref={statsRef} className="section-padding relative overflow-hidden bg-gradient-to-br from-slate-900 via-blue-900/50 to-slate-800">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-900/20 to-purple-900/20"></div>
        
        {/* Decorative Elements */}
        <div className="absolute top-10 left-10 w-20 h-20 bg-blue-500/10 rounded-full blur-xl"></div>
        <div className="absolute bottom-10 right-10 w-32 h-32 bg-purple-500/10 rounded-full blur-xl"></div>
        
        <div className="relative container-custom">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={statsInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-display font-bold text-white mb-4 text-gradient">
              Наши достижения в цифрах
            </h2>
            <div className="w-24 h-1 bg-gradient-to-r from-blue-500 to-purple-500 mx-auto rounded-full"></div>
          </motion.div>
          
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate={statsInView ? "visible" : "hidden"}
            className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12"
          >
            {stats.map(({ icon: Icon, value, label, color, trend }, index) => (
              <motion.div 
                key={label} 
                variants={staggerItem}
                whileHover={{ scale: 1.05, y: -10 }}
                className="group"
              >
                <StatCard
                  key={label}
                  icon={Icon}
                  value={value}
                  label={label}
                  color={color}
                  trend={trend}
                />
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section ref={featuresRef} className="section-padding relative overflow-hidden bg-gradient-to-br from-slate-800 via-blue-800/30 to-slate-900">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-900/10 to-purple-900/10"></div>
        
        {/* Animated Background Elements */}
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-gradient-to-r from-blue-500/5 to-purple-500/5 rounded-full blur-3xl floating"></div>
        <div className="absolute bottom-1/4 right-1/4 w-48 h-48 bg-gradient-to-r from-cyan-500/5 to-blue-500/5 rounded-full blur-3xl floating" style={{ animationDelay: '2s' }}></div>
        
        <div className="relative container-custom">
          <motion.div
            variants={fadeInUp}
            initial="hidden"
            animate={featuresInView ? "visible" : "hidden"}
            className="text-center mb-16"
          >
            <h2 className="text-5xl font-display font-bold text-white mb-6 text-gradient">
              Система развития кадетов
            </h2>
            <div className="w-32 h-1 bg-gradient-to-r from-blue-500 to-purple-500 mx-auto rounded-full mb-6"></div>
            <p className="text-xl text-white/90 max-w-3xl mx-auto text-shadow text-balance">
              Комплексный подход к оценке успехов и мотивации кадетов через современные технологии
            </p>
          </motion.div>

          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate={featuresInView ? "visible" : "hidden"}
            className="grid md:grid-cols-3 gap-8 md:gap-12"
          >
            {features.map(({ icon: Icon, title, description, gradient }, index) => (
              <motion.div
                key={title}
                variants={staggerItem}
                whileHover={{ y: -15, scale: 1.05 }}
                className={`card-gradient ${gradient} p-8 rounded-3xl shadow-2xl border border-white/10 group relative overflow-hidden`}
              >
                {/* Hover Effect Overlay */}
                <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                
                <div className="relative z-10">
                <div className="flex items-center justify-center w-20 h-20 mb-8 rounded-2xl bg-white/20 group-hover:bg-white/30 transition-all duration-500 group-hover:scale-110 group-hover:rotate-3">
                  <Icon className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-2xl font-display font-bold text-white mb-4 text-shadow group-hover:text-glow transition-all duration-500">{title}</h3>
                <p className="text-white/90 text-shadow leading-relaxed">{description}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Achievements Section */}
      <section ref={achievementsRef} className="section-padding relative overflow-hidden bg-gradient-to-br from-slate-900 via-purple-900/30 to-slate-800">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-900/20 to-blue-900/20"></div>
        
        {/* Decorative Elements */}
        <div className="absolute top-20 right-20 w-40 h-40 bg-purple-500/10 rounded-full blur-2xl floating"></div>
        <div className="absolute bottom-20 left-20 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl floating" style={{ animationDelay: '3s' }}></div>
        
        <div className="relative container-custom">
          <motion.div
            variants={fadeInUp}
            initial="hidden"
            animate={achievementsInView ? "visible" : "hidden"}
            className="text-center mb-16"
          >
            <h2 className="text-5xl font-display font-bold text-white mb-6 text-gradient">
              Наши достижения
            </h2>
            <div className="w-32 h-1 bg-gradient-to-r from-purple-500 to-blue-500 mx-auto rounded-full mb-6"></div>
            <p className="text-xl text-white/90 max-w-3xl mx-auto text-shadow text-balance">
              Гордимся успехами наших кадетов и признанием на региональном уровне
            </p>
          </motion.div>

          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate={achievementsInView ? "visible" : "hidden"}
            className="grid md:grid-cols-3 gap-8 md:gap-12"
          >
            {achievements.map(({ title, year, icon: Icon, color }, index) => (
              <motion.div
                key={title}
                variants={staggerItem}
                whileHover={{ y: -15, scale: 1.05 }}
                className={`card-gradient ${color} p-8 rounded-3xl shadow-2xl border border-white/10 text-center group relative overflow-hidden`}
              >
                {/* Hover Effect Overlay */}
                <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                
                <div className="relative z-10">
                <div className="flex items-center justify-center w-20 h-20 mb-8 rounded-2xl bg-white/20 group-hover:bg-white/30 transition-all duration-500 group-hover:scale-110 group-hover:rotate-3 mx-auto">
                  <Icon className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-2xl font-display font-bold text-white mb-4 text-shadow group-hover:text-glow transition-all duration-500">{title}</h3>
                <div className="text-white/80 text-xl font-semibold">{year}</div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="section-padding relative overflow-hidden bg-gradient-to-r from-blue-600 via-purple-600 to-blue-800">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/80 via-purple-600/80 to-blue-800/80"></div>
        
        {/* Animated Background */}
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-purple-600 to-blue-800 opacity-80" style={{ backgroundSize: '400% 400%', animation: 'gradientMove 8s ease infinite' }}></div>
        
        <div className="relative max-w-4xl mx-auto text-center container-custom">
          <motion.div
            variants={scaleIn}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            <h2 className="text-6xl font-display font-black text-white mb-8 text-glow">
              Готов стать лучшим?
            </h2>
            <div className="w-32 h-1 bg-white/50 mx-auto rounded-full mb-8"></div>
            <p className="text-2xl text-white/95 mb-12 text-shadow text-balance leading-relaxed">
              Присоединяйся к системе рейтинга и покажи свои достижения всему корпусу
            </p>
            <Link to="/login">
              <motion.div
                whileHover={{ scale: 1.08, y: -5 }}
                whileTap={{ scale: 0.95 }}
                className="inline-flex items-center bg-white hover:bg-gray-100 text-blue-600 px-12 py-5 rounded-full font-bold text-xl transition-all duration-500 shadow-2xl hover:shadow-white/25 relative overflow-hidden group"
              >
                {/* Button shine effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                <span className="relative z-10">
                Войти в систему
                </span>
                <ChevronRight className="ml-2 h-5 w-5" />
              </motion.div>
            </Link>
          </motion.div>
        </div>
      </section>
    </main>
  );
};

export default HomePage;
import AssociatedCompanies from "./components/landing/AssociatedCompanies";
import BannerSection from "./components/landing/BannerSection";
import BasePack from "./components/landing/BasePack";
import Comments from "./components/landing/Comments";
import frequentlyQuestions from "./components/landing/data/frequentlyQuestions";
import FrequentlyQuestions from "./components/landing/FrequentlyQuestions";
import HeroSection from "./components/landing/HeroSection";
import InfoPack from "./components/landing/InfoPack";
import ManagementMap from "./components/landing/ManagementMap";


const HomePage = () => {
  return (
    <>
      <HeroSection />
      <AssociatedCompanies />
      <ManagementMap />
      <BasePack />
      <InfoPack />
      <BannerSection />
      <Comments />
      <FrequentlyQuestions items={frequentlyQuestions} />
    </>
  );
};

export default HomePage;
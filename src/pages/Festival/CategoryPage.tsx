import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getCategoryById } from '../../configs/festival/categories';
import { getFeaturesByCategory, Feature, isLegacyFeature } from '../../configs/festival/features';
import { BottomNav } from '../../components/BottomNav';
import { BackButton } from '../../components/BackButton';
import { HomeButton } from '../../components/HomeButton';
import { useCredits, useCreditActions } from '../../stores/creditStore';
import { BlessingTextBackground, VoiceCardBackground, CyberFortuneBackground, HighEQBackground } from '../../components/FeatureCardBackgrounds';
import '../../styles/festival-design-system.css';
import '../../styles/festival-category-glass.css';
import '../../components/FeatureCardBackgrounds.css';

/**
 * 📂 分类页
 *
 * 展示某个分类下的所有功能
 * 如：新年形象下有 3D头像、财神变身 等
 */

const FestivalCategoryPage: React.FC = () => {
  const { categoryId } = useParams<{ categoryId: string }>();
  const navigate = useNavigate();

  const category = getCategoryById(categoryId || '');
  const features = getFeaturesByCategory(categoryId || '');

  // 积分状态
  const currentCredits = useCredits();
  const { checkCredits } = useCreditActions();
  const [showInsufficientModal, setShowInsufficientModal] = useState(false);
  const [requiredCredits, setRequiredCredits] = useState(0);

  if (!category) {
    return (
      <div className="festival-layout">
        <div className="festival-category-page">
          <div className="category-error">
            <h2>分类未找到</h2>
            <HomeButton />
          </div>
        </div>
      </div>
    );
  }

  // 点击功能进入功能页
  const handleFeatureClick = (feature: Feature) => {
    // 临时关闭积分检查，方便测试
    // const creditsRequired = feature.access.credits || 0;
    // if (creditsRequired > 0 && !checkCredits(creditsRequired)) {
    //   setRequiredCredits(creditsRequired);
    //   setShowInsufficientModal(true);
    //   return;
    // }

    const processType = feature.process.type;

    // 图片类功能
    if (processType === 'image') {
      // M11数字人拜年：跳转视频制作页
      if (feature.id === 'M11') {
        navigate('/festival/video');
        return;
      }

      // M7运势抽卡：跳转专用运势页面
      if (feature.id === 'M7' || feature.input.type === 'none') {
        navigate(`/festival/fortune/${feature.id}`);
        return;
      }

      // 判断是否需要模板选择
      if (feature.input.needTemplate) {
        // M2写真：使用新版模板选择页
        if (feature.id === 'M2') {
          navigate('/festival/m2-template-select');
          return;
        }
        // M3情侣：使用新版模板选择页
        if (feature.id === 'M3') {
          navigate('/festival/m3-template-select');
          return;
        }
        // M1/M4：使用旧版模板选择页
        navigate(`/festival/template-select/${feature.id}`);
      } else if (isLegacyFeature(feature.id)) {
        // 旧版遗留功能
        navigate(`/festival/template-select/${feature.id}`);
      } else {
        // 其他新功能（如果有的话）
        navigate(`/festival/lab/${feature.id}`);
      }
      return;
    }

    // 文案类功能
    if (processType === 'text') {
      // M8赛博算命：跳转专用算命页面
      if (feature.id === 'M8') {
        navigate('/festival/fortune-card');
        return;
      }
      // M10高情商回复：跳转专用回复页面
      if (feature.id === 'M10') {
        navigate('/festival/smart-reply');
        return;
      }
      navigate(`/festival/text/${feature.id}`);
      return;
    }

    // 视频类功能
    if (processType === 'video') {
      navigate('/festival/category/video');
      return;
    }

    // 语音类功能
    if (processType === 'audio') {
      navigate('/festival/voice');
      return;
    }
  };

  // 获取功能的免费次数显示
  const renderFreeQuota = (feature: Feature) => {
    const { access } = feature;
    const creditsRequired = access.credits || 0;

    // 不显示积分，保持原有布局
    return null;

    // 如果需要显示，使用小标签在右下角
    // return creditsRequired > 0 ? (
    //   <span className="feature-credits-small">{creditsRequired}</span>
    // ) : null;
  };

  return (
    <div className="festival-layout">
      <div className="festival-category-page">
        {/* 顶部导航 */}
        <div className="category-header">
          <BackButton />
          <h1 className="category-title">{category.name}</h1>
          <HomeButton />
        </div>

        {/* 功能列表 */}
        <div className="feature-grid">
          {features.map((feature) => (
            <div
              key={feature.id}
              className="feature-card feature-card-v2"
              data-feature-id={feature.id}
              onClick={() => handleFeatureClick(feature)}
            >
              {/* 上层：预览图或背景组件 */}
              {feature.previewImage ? (
                <div className="feature-preview-bg" style={{
                  backgroundImage: `url(${feature.previewImage})`
                }} />
              ) : (
                <div className="feature-preview-bg">
                  {feature.id === 'text-blessing' && <BlessingTextBackground />}
                  {feature.id === 'M5' && <VoiceCardBackground />}
                  {feature.id === 'M8' && <CyberFortuneBackground />}
                  {feature.id === 'M10' && <HighEQBackground />}
                </div>
              )}

              {/* 下层：功能信息 */}
              <div className="feature-info-v2">
                <h3 className="feature-name">{feature.name}</h3>
                <p className="feature-desc">{feature.subtitle}</p>
                {renderFreeQuota(feature)}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 底部导航栏 */}
      <BottomNav />

      {/* 积分不足弹窗 */}
      {showInsufficientModal && (
        <div className="modal-overlay" onClick={() => setShowInsufficientModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>💰 积分不足</h2>
            <p>此功能需要 <strong>{requiredCredits}</strong> 积分</p>
            <p>当前积分: <strong>{currentCredits}</strong></p>
            <div className="modal-actions">
              <button
                className="btn-secondary"
                onClick={() => setShowInsufficientModal(false)}
              >
                取消
              </button>
              <button
                className="btn-primary"
                onClick={() => navigate('/festival/recharge')}
              >
                去充值
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FestivalCategoryPage;

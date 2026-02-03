import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getCategoryById } from '../../configs/festival/categories';
import { getFeaturesByCategory, Feature, isLegacyFeature } from '../../configs/festival/features';
import { BottomNav } from '../../components/BottomNav';
import { BackButton } from '../../components/BackButton';
import '../../styles/festival-design-system.css';
import '../../styles/festival-category-glass.css';

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

  if (!category) {
    return (
      <div className="festival-layout">
        <div className="festival-category-page">
          <div className="category-error">
            <h2>分类未找到</h2>
            <button onClick={() => navigate('/festival/home')}>返回首页</button>
          </div>
        </div>
      </div>
    );
  }

  // 点击功能进入功能页
  const handleFeatureClick = (feature: Feature) => {
    const processType = feature.process.type;

    // 图片类功能
    if (processType === 'image') {
      // M11数字人拜年：跳转专用数字人页面
      if (feature.id === 'M11') {
        navigate('/festival/digital-human');
        return;
      }

      // M7运势抽卡：跳转专用运势页面
      if (feature.id === 'M7' || feature.input.type === 'none') {
        navigate(`/festival/fortune/${feature.id}`);
        return;
      }

      // 判断是否需要模板选择
      if (feature.input.needTemplate) {
        // 需要模板选择：M1/M2/M3/M4
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
      navigate(`/festival/video-lab/${feature.id}`);
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

    if (access.freePerDay === -1) {
      return <span className="feature-quota free">免费无限</span>;
    }

    return (
      <span className="feature-quota">
        免费{access.freePerDay}次/天
        {access.freeWatermark && '，带水印'}
      </span>
    );
  };

  return (
    <div className="festival-layout">
      <div className="festival-category-page">
        {/* 顶部导航 */}
        <div className="category-header">
          <BackButton />
          <h1 className="category-title">{category.name}</h1>
          <button className="home-btn" onClick={() => navigate('/festival/home')}>
            首页
          </button>
        </div>

        {/* 功能列表 */}
        <div className="feature-grid">
          {features.map((feature) => (
            <div
              key={feature.id}
              className="feature-card feature-card-v2"
              onClick={() => handleFeatureClick(feature)}
            >
              {/* 上层：预览图 */}
              {feature.previewImage && (
                <div className="feature-preview-bg" style={{
                  backgroundImage: `url(${feature.previewImage})`
                }} />
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
    </div>
  );
};

export default FestivalCategoryPage;

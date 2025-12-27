import React from 'react';
import styles from '../MainStage.module.css';
import { Course } from '../../../types/index';

interface CourseSectionProps {
  courses: Course[];
}

const CourseSection: React.FC<CourseSectionProps> = ({ courses }) => {
  if (!courses || courses.length === 0) return null;

  return (
    <div className={styles.courseSectionContainer}>
      {/* 1. 标题区 - 恢复原始样式名 */}
      <div className={styles.taskTitle}>精品课程推荐</div>
      
      {/* 2. 容器 - 强制 4 列横排 */}
      <div className={styles.courseCardsWrapper} style={{ width: '100%', overflow: 'visible' }}>
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(4, 1fr)', 
          gap: '24px',
          width: '100%'
        }}>
          {courses.map((course: Course) => (
            <div className={styles.courseCard} key={course.id}>
              <div className={styles.courseCardVideoContainer}>
                {course.videoUrl && course.videoUrl.indexOf('picsum.photos') !== -1 ? (
                  <img 
                    className={styles.courseCardVideo} 
                    src={course.videoUrl} 
                    alt={course.title} 
                  />
                ) : (
                  <video className={styles.courseCardVideo} muted loop>
                    <source src={course.videoUrl} type="video/mp4" />
                  </video>
                )}
              </div>
              <div className={styles.courseCardName}>{course.title}</div>
              <div className={styles.courseCardInfo}>
                <div className={styles.courseCardDifficulty}>难度：{course.difficulty}</div>
                <div className={styles.courseCardDuration}>时长：{course.duration}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CourseSection;
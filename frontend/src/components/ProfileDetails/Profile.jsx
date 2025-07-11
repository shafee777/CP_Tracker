// frontend/src/components/ProfileDetails/Profile.jsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ProfileCard from './ProfileCard';
import SolvedProblems from './SolvedProblems';
import ActivityHeatmap from './ActivityHeatmap';
import RatingGraph from './RatingGraph';
import axios from 'axios';

export default function Profile() {
  const [userData, setUserData] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/auth/login', { replace: true });
      return;
    }

    axios
      .get('/api/auth/profile', {
        headers: { Authorization: `Bearer ${token}` }
      })
      .then((res) => {
        setUserData(res.data);
      })
      .catch((err) => {
        console.error('Failed to fetch profile', err);
        localStorage.removeItem('token');
        localStorage.removeItem('isLoggedIn');
        navigate('/auth/login', { replace: true });
      });
  }, [navigate]);

  if (!userData) return <div className="p-4">Loading...</div>;

  const leet = userData.platformDetails?.leetcode || {};
  const cf = userData.platformDetails?.codeforces || {};
  const cc = userData.platformDetails?.codechef || {};
  const leetMaxRating = leet.ratingHistory?.length? Math.max(...leet.ratingHistory.map(r => r.ratingAfter || 0)): 0;
  const leetcodeRatingData =
  (leet.contests?.ratingHistory || []).map(entry => ({
    contestName: entry.title,
    rating: entry.ratingAfter,
    rank: entry.ranking,
    date: entry.startTime
  }));
  
  const codechefRatingData =
  (cc.ratingHistory || []).map(entry => ({
    contestName: entry.contestName || entry.title,
    rating:     entry.newRating     || entry.rating,
    rank:       entry.rank,
    date:       entry.date
  }));
  const codeforcesRatingData =
  (cf.contests?.contests || cf.contests || []).map(entry => ({
    contestName: entry.contestName || entry.title,
    rating:     entry.newRating    || entry.ratingAfter || entry.rating,
    rank:       entry.rank,
    date:       entry.date
  }));
  
  return (
    <div className="flex flex-col md:flex-row gap-6 p-4">
      <div className="flex-1 flex flex-col gap-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <SolvedProblems
            solved={{
              total:
                (leet.problemsSolved?.find(p => p.difficulty === 'All')?.count || 0) +
                (cf.totalSolved || 0) +
                (cc.totalSolved || 0),
              leetcode: leet.problemsSolved?.find(p => p.difficulty === 'All')?.count || 0,
              codeforces: cf.totalSolved || 0,
              codechef: cc.totalSolved || 0,
              leetcodeUsername: leet.username || '',
              codeforcesUsername: userData.codeforcesUsername || '',
              codechefUsername: cc.username || ''
            }}
            difficult={{
              easy:   leet.problemsSolved?.find(p => p.difficulty === 'Easy')?.count   || 0,
              medium: leet.problemsSolved?.find(p => p.difficulty === 'Medium')?.count || 0,
              hard:   leet.problemsSolved?.find(p => p.difficulty === 'Hard')?.count   || 0
            }}
          />
          <ActivityHeatmap data={leet.heatmap?.data || []} />
        </div>
        <RatingGraph
          contest={{
              total:
                (leet.contests?.total || 0) +
                (cf.contests?.totalContests || 0) +
                (cc.totalContests || 0),
              leetcode: leet.contests?.total || 0,
              codeforces: cf.contests?.totalContests || 0,
              codechef: cc.totalContests || 0
            }}
            ratingData={{
              leetcode:   leetcodeRatingData,
              codechef:   codechefRatingData,
              codeforces: codeforcesRatingData
            }}
          />
      </div>

      <div className="md:w-1/4 h-full self-stretch">
      
        <ProfileCard
          user={{
            _id: userData._id || userData.id,
            name: userData.fullName || [],
            username: userData.username,
            location: userData.location || 'India',
            college: userData.college,
            avatar: userData.avatar,
            leetcodeUsername: leet.username || '',
            codeforcesUsername: userData.codeforcesUsername || '',
            codechefUsername: cc.username || '',
            totalSolved:
              (leet.problemsSolved?.find(p => p.difficulty === 'All')?.count || 0) +
              (cf.totalSolved || 0) +
              (cc.totalSolved || 0),
            contests:
              (leet.contests?.total || 0) +
              (cf.contests?.totalContests || 0) +
              (cc.totalContests || 0),

            rating: Math.max(leetMaxRating, cf.rating || 0, cc.rating || 0),


          }}
          onUpdate={(updatedUser) => {
            setUserData((prev) => ({
              ...prev,
              ...updatedUser,
              platformDetails: {
                ...prev.platformDetails,
                leetcode: {
                  ...prev.platformDetails.leetcode,
                  username: updatedUser.leetcodeUsername || leet.username
                },
                codeforces: {
                  ...prev.platformDetails.codeforces,
                  username: updatedUser.codeforcesUsername || cf.username
                },
                codechef: {
                  ...prev.platformDetails.codechef,
                  username: updatedUser.codechefUsername || cc.username
                }
              }
            }))
          }}
        />

      </div>
    </div>
  );
}

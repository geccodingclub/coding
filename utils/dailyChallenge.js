const cron = require('node-cron');
const Contest = require('../models/Contest');
const User = require('../models/User');
const { sendEmail } = require('./mailer');

const basicProblems = [
  { title: "Reverse a String", description: "Write a program that takes a string as input and outputs the reversed string. Very common 1st semester logic building question.", link: "https://leetcode.com/problems/reverse-string/" },
  { title: "Palindrome Number", description: "Given an integer x, return true if x is a palindrome, and false otherwise. Try to do it without converting it to a string first!", link: "https://leetcode.com/problems/palindrome-number/" },
  { title: "Two Sum", description: "Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.", link: "https://leetcode.com/problems/two-sum/" },
  { title: "Fizz Buzz", description: "Print integers 1 to N, but print 'Fizz' if an integer is divisible by 3, 'Buzz' if an integer is divisible by 5, and 'FizzBuzz' if an integer is divisible by both 3 and 5.", link: "https://leetcode.com/problems/fizz-buzz/" },
  { title: "Fibonacci Number", description: "The Fibonacci numbers form a sequence where each number is the sum of the two preceding ones. Calculate the Nth Fibonacci number.", link: "https://leetcode.com/problems/fibonacci-number/" },
  { title: "Valid Anagram", description: "Given two strings s and t, return true if t is an anagram of s, and false otherwise.", link: "https://leetcode.com/problems/valid-anagram/" },
  { title: "Find Maximum Item", description: "Given an array of unordered integers, write a basic for-loop script to find and return the maximum value in the array. O(N) time complexity.", link: "https://leetcode.com/problems/third-maximum-number/" },
  { title: "Check if Prime Array", description: "Given an array, return a new array where all non-prime numbers have been filtered out. Only keep the prime numbers.", link: "https://leetcode.com/problems/count-primes/" },
  { title: "Power of Two", description: "Given an integer n, return true if it is a power of two. Otherwise, return false.", link: "https://leetcode.com/problems/power-of-two/" },
  { title: "Missing Number", description: "Given an array nums containing n distinct numbers in the range [0, n], return the only number in the range that is missing from the array.", link: "https://leetcode.com/problems/missing-number/" },
];

const startDailyChallengeCron = () => {
  // Schedule a task to run every day at 09:00 AM server time
  cron.schedule('0 9 * * *', async () => {
    console.log('[CRON] Initiating automated daily challenge...');
    try {
      // Pick a random problem
      const randomIndex = Math.floor(Math.random() * basicProblems.length);
      const problem = basicProblems[randomIndex];

      // Find an admin user to assign as the creator (so createdBy isn't null)
      const admin = await User.findOne({ role: { $in: ['PRESIDENT', 'VOLUNTEER'] } });
      if (!admin) {
        console.log('[CRON] No admin found to create the challenge. Aborting.');
        return;
      }

      const today = new Date();
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      // Create the contest
      const contest = new Contest({
        title: `Daily Challenge: ${problem.title}`,
        description: problem.description,
        platformLink: problem.link,
        pointsReward: 10,
        startDate: today,
        endDate: tomorrow,
        createdBy: admin._id
      });
      await contest.save();
      console.log(`[CRON] Deployed Daily Challenge: ${contest.title}`);

      // Send email to all verified users
      const users = await User.find({ isVerified: true }).select('email name');
      const emailPromises = users.map(u => 
        sendEmail(
          u.email,
          `Today's Daily Challenge: ${problem.title} 🚀`,
          `
            <div style="font-family: sans-serif; padding: 20px; border: 1px solid #1e293b; border-radius: 10px; background-color: #0f172a; color: #f1f5f9;">
              <h2 style="color: #3b82f6; border-bottom: 1px solid #1e293b; padding-bottom: 10px;">New Automated Daily Challenge</h2>
              <p>Hi ${u.name},</p>
              <p>It's time for your daily logic building exercise. We have deployed a 1st-semester level problem for you to solve and earn points.</p>
              
              <div style="background-color: #1e293b; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #3b82f6;">
                <p style="margin-top: 0;"><strong>Challenge:</strong> ${problem.title}</p>
                <p><strong>Description:</strong><br/>${problem.description}</p>
                <p><strong>Reward:</strong> 10 Points</p>
                <p style="margin-bottom: 0;"><strong>Deadline:</strong> ${tomorrow.toLocaleString()}</p>
              </div>
              
              <a href="${problem.link}" style="display: inline-block; padding: 12px 24px; background-color: #3b82f6; color: white; text-decoration: none; border-radius: 5px; font-weight: bold;">Attempt Challenge on Platform</a>
              
              <p style="margin-top: 30px;">Once completed, don't forget to submit your proof on the <a href="https://coding-club-chi.vercel.app/contests" style="color: #3b82f6;">Contests Dashboard</a> to secure your points!</p>
              
              <br/>
              <p style="font-size: 12px; color: #64748b;"><em>Cortex GEC Bhojpur • Automated Delivery System</em></p>
            </div>
          `
        ).catch(err => console.error(`[CRON] Failed to send email to ${u.email}:`, err))
      );
      
      await Promise.all(emailPromises);
      console.log(`[CRON] Broadcast sent to ${users.length} verified members.`);
      
    } catch (err) {
      console.error('[CRON] Automated Daily Challenge Failed:', err);
    }
  });

  console.log('[CRON] Daily Challenge subsystem initialized. Scheduled for 09:00 AM daily.');
};

module.exports = { startDailyChallengeCron };

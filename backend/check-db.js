
const mongoose = require('mongoose');
const mongoUrl = 'mongodb+srv://attherate00_db_user:Showoff10@sde-social-media.39pjut8.mongodb.net/?appName=SDE-Social-Media';

async function checkDb() {
    try {
        await mongoose.connect(mongoUrl);
        console.log('Connected to MongoDB');

        // Use existing collection names
        const UserSchema = new mongoose.Schema({ username: String }, { collection: 'users' });
        const PostSchema = new mongoose.Schema({ title: String, author: mongoose.Schema.Types.ObjectId }, { collection: 'posts' });

        const User = mongoose.model('User', UserSchema);
        const Post = mongoose.model('Post', PostSchema);

        const users = await User.find({});
        const posts = await Post.find({});

        console.log(`Total users: ${users.length}`);
        users.forEach(u => console.log(` - ${u.username} (${u._id})`));

        console.log(`Total posts: ${posts.length}`);
        posts.forEach(p => console.log(` - ${p.title} (Author: ${p.author})`));

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

checkDb();

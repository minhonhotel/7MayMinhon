export const englishDictionary = new Set([
  // Common words
  'good', 'afternoon', 'morning', 'evening', 'hello', 'hi', 'welcome', 'thank', 'thanks', 'you',
  'please', 'help', 'can', 'could', 'would', 'will', 'shall', 'may', 'might', 'must',
  'have', 'has', 'had', 'am', 'is', 'are', 'was', 'were', 'been', 'being',
  'do', 'does', 'did', 'done', 'doing',
  
  // Hotel-related
  'hotel', 'room', 'booking', 'reservation', 'check', 'in', 'out', 'service',
  'breakfast', 'lunch', 'dinner', 'restaurant', 'pool', 'gym', 'spa', 'wifi',
  'bed', 'bathroom', 'shower', 'towel', 'key', 'card', 'reception', 'lobby',
  'floor', 'elevator', 'stairs', 'air', 'conditioning', 'housekeeping', 'clean',
  'laundry', 'parking', 'car', 'taxi', 'airport', 'transfer', 'shuttle',
  'single', 'double', 'twin', 'suite', 'deluxe', 'standard', 'premium', 'vip',
  'balcony', 'view', 'sea', 'mountain', 'city', 'garden', 'pool', 'beach',
  
  // Time-related
  'today', 'tomorrow', 'yesterday', 'now', 'later', 'soon', 'time', 'date',
  'morning', 'afternoon', 'evening', 'night', 'day', 'week', 'month', 'year',
  'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday',
  'january', 'february', 'march', 'april', 'may', 'june', 'july', 'august',
  'september', 'october', 'november', 'december',
  'hour', 'minute', 'second', 'early', 'late', 'schedule', 'appointment',
  
  // Numbers and quantities
  'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten',
  'first', 'second', 'third', 'fourth', 'fifth', 'sixth', 'seventh', 'eighth', 'ninth', 'tenth',
  'many', 'much', 'few', 'little', 'some', 'any', 'all', 'none',
  'hundred', 'thousand', 'million',
  
  // Question words
  'what', 'when', 'where', 'who', 'why', 'how', 'which', 'whose', 'whom',
  
  // Prepositions
  'in', 'on', 'at', 'to', 'from', 'with', 'without', 'by', 'for', 'of',
  'about', 'above', 'across', 'after', 'against', 'along', 'among', 'around',
  'before', 'behind', 'below', 'beneath', 'beside', 'between', 'beyond',
  'through', 'during', 'until', 'within', 'throughout',
  
  // Conjunctions
  'and', 'or', 'but', 'nor', 'for', 'yet', 'so', 'because', 'although', 'unless',
  'since', 'while', 'where', 'if', 'then', 'than', 'that',
  'therefore', 'however', 'moreover', 'furthermore',
  
  // Common adjectives
  'good', 'bad', 'big', 'small', 'hot', 'cold', 'new', 'old', 'high', 'low',
  'happy', 'sad', 'clean', 'dirty', 'easy', 'hard', 'early', 'late', 'fast', 'slow',
  'right', 'wrong', 'true', 'false', 'same', 'different', 'next', 'last',
  'beautiful', 'comfortable', 'convenient', 'excellent', 'perfect', 'great',
  'available', 'busy', 'free', 'full', 'empty', 'ready', 'special',
  
  // Common adverbs
  'very', 'really', 'quite', 'rather', 'too', 'also', 'just', 'only', 'even',
  'still', 'already', 'again', 'often', 'always', 'never', 'sometimes', 'usually',
  'immediately', 'quickly', 'slowly', 'carefully', 'well', 'badly',
  
  // Pronouns
  'i', 'you', 'he', 'she', 'it', 'we', 'they', 'me', 'him', 'her', 'us', 'them',
  'my', 'your', 'his', 'its', 'our', 'their', 'mine', 'yours', 'hers', 'ours', 'theirs',
  'this', 'that', 'these', 'those', 'myself', 'yourself', 'himself', 'herself', 'itself',
  'ourselves', 'themselves',

  // Proper Names - Places
  'vietnam', 'muine', 'phanrang', 'nhatrang', 'hochiminh', 'hanoi', 'danang', 'saigon',
  'asia', 'europe', 'america', 'australia', 'africa',
  'minhon', 'nguyen', 'dinh', 'chieu', 'le', 'tran', 'pham', 'hoang',
  'binhthuan', 'vungtau', 'dalat', 'halong', 'hue', 'hoian', 'cantho', 'haiphong',
  'quynhon', 'phanthiet', 'camranh', 'condao', 'phuquoc',
  
  // Proper Names - Hotels & Landmarks
  'minhonhotel', 'muibeach', 'redsand', 'whitesand', 'fairystream', 'fishingvillage',
  'waterfountain', 'lighthouse', 'harbor', 'market', 'nightmarket',
  'tacu', 'mountain', 'beach', 'resort', 'spa', 'golf', 'club', 'center',
  'waterpark', 'amusementpark', 'museum', 'temple', 'pagoda', 'church',
  
  // Common Vietnamese Words (in English letters)
  'xin', 'chao', 'cam', 'on', 'tam', 'biet', 'khach', 'san',
  'nha', 'hang', 'bien', 'duong', 'pho', 'cho', 'cua', 'nuoc',
  'banh', 'mi', 'pho', 'com', 'chao', 'cafe', 'tra', 'sua',
  'dao', 'bien', 'nui', 'song', 'ho', 'cau', 'cang', 'ben',
  
  // Vietnamese Food & Drinks
  'pho', 'banhmi', 'banhxeo', 'springroll', 'ricepaper', 'fishsauce',
  'nuocmam', 'coffee', 'tea', 'juice', 'water', 'beer', 'wine',
  'breakfast', 'lunch', 'dinner', 'snack', 'dessert', 'fruit',
  
  // Services & Amenities
  'wifi', 'internet', 'television', 'tv', 'phone', 'minibar', 'safe',
  'aircon', 'fan', 'heater', 'lamp', 'light', 'power', 'socket',
  'massage', 'spa', 'gym', 'fitness', 'swimming', 'tennis', 'golf',
  'tour', 'guide', 'ticket', 'booking', 'reservation', 'payment',
  'cash', 'card', 'credit', 'debit', 'visa', 'mastercard', 'receipt'
]); 
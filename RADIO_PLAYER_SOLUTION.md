# Radio Player Solution for 8EH Radio ITB

## Problem Analysis

The original issue was that the radio stream URL `http://uk25freenew.listen2myradio.com:32559/listen.pls` was not working properly in your React web application, even though it worked in VLC. The problem was related to:

1. **Session-based streaming**: The radio service requires dynamic session URLs with `typeportmount` parameters
2. **CORS policies**: Direct HTTP access from web browsers to the streaming service
3. **Stream format compatibility**: The `.pls` file contains metadata, not the actual stream

## Investigation Results

When analyzing the streaming service, I found:

- The `.pls` file contains: `File1=http://uk25freenew.listen2myradio.com:32559/`
- The embed player generates dynamic URLs like: `https://uk25freenew.listen2myradio.com/live.mp3?typeportmount=s1_32559_stream_841718607`
- The `typeportmount` parameter changes with each session and is required for stream access

## Solution Implementation

### 1. Custom Hook: `useRadioStream.js`

Located at: `/app/hooks/useRadioStream.js`

This hook manages:
- Dynamic URL generation with session IDs
- Automatic retry logic with fallback
- Error handling and stream state management
- URL refresh capabilities

Key features:
```javascript
const generateStreamUrl = () => {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 1000000000);
  const sessionId = `s1_32559_stream_${random}`;
  
  const params = new URLSearchParams({
    typeportmount: sessionId,
    t: timestamp.toString(),
    _: Math.random().toString(36).substr(2, 9)
  });
  
  return `https://uk25freenew.listen2myradio.com/live.mp3?${params.toString()}`;
};
```

### 2. Radio Player Component: `RadioPlayer.jsx`

Located at: `/app/components/RadioPlayer.jsx`

Features:
- **Dynamic stream URL generation**: Creates new session URLs for each play attempt
- **Robust error handling**: Automatic retries with exponential backoff
- **Cross-component communication**: Integrates with your existing navbar controls
- **Responsive design**: Compact and full-size variants
- **Real-time status updates**: Loading, buffering, playing, error states
- **Volume control**: User-adjustable audio levels
- **Stream refresh**: Manual retry capability

### 3. Integration with Existing Code

The component maintains compatibility with your existing navbar controls through custom events:
- Listens for `triggerPlayerControl` events from navbar
- Dispatches `audioStateChanged` events to notify navbar of play state

## Usage Examples

### Basic Implementation (Current)
```jsx
<RadioPlayer 
  className="w-full max-w-md"
  showTitle={false}
  compact={true}
/>
```

### Full-Featured Player
```jsx
<RadioPlayer 
  className="w-full max-w-lg"
  showTitle={true}
  compact={false}
/>
```

### Component Props
- `className`: Additional CSS classes
- `showTitle`: Show/hide the radio station title
- `compact`: Use compact layout for smaller spaces

## Technical Details

### Stream URL Structure
```
https://uk25freenew.listen2myradio.com/live.mp3?typeportmount=s1_32559_stream_RANDOMID&t=TIMESTAMP&_=SESSIONID
```

### Error Handling Strategy
1. **Initial connection failure**: Auto-retry up to 3 times
2. **Play promise rejection**: Handle browser autoplay policies
3. **Stream interruption**: Automatic stream refresh
4. **Network issues**: Graceful degradation with user feedback

### Browser Compatibility
- Modern browsers with HTML5 audio support
- Handles autoplay restrictions
- Cross-origin audio streaming (CORS)
- Progressive enhancement

## Benefits of This Solution

1. **Reliability**: Automatic session management and retry logic
2. **User Experience**: Smooth playback with loading states
3. **Integration**: Works seamlessly with existing navbar controls
4. **Maintainability**: Clean separation of concerns with custom hook
5. **Flexibility**: Configurable appearance and behavior
6. **Performance**: Efficient stream management and memory cleanup

## Troubleshooting

### Common Issues

1. **"NotAllowedError"**: Browser autoplay policy
   - Solution: User must interact with play button first

2. **Connection timeouts**: Network or server issues
   - Solution: Component automatically retries with fresh session URLs

3. **CORS errors**: Cross-origin restrictions
   - Solution: Using HTTPS endpoint with proper headers

### Debug Information

The component logs detailed error information to the browser console and displays user-friendly status messages.

## Future Enhancements

Potential improvements:
- Metadata display (song titles, artist info)
- Recording/bookmark functionality
- Multiple stream quality options
- Visualizer integration
- Mobile app integration

## Files Created/Modified

1. **New Files:**
   - `/app/hooks/useRadioStream.js` - Stream management hook
   - `/app/components/RadioPlayer.jsx` - Main player component
   - `RADIO_PLAYER_SOLUTION.md` - This documentation

2. **Modified Files:**
   - `/app/page.jsx` - Updated to use new RadioPlayer component

The solution is now live and should provide reliable radio streaming for your 8EH Radio ITB website.

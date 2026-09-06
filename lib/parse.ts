import AsyncStorage from '@react-native-async-storage/async-storage';
import Parse from 'parse/react-native';
import { parseConfig } from '@/lib/parseConfig';

/**
 * Parse needs somewhere to keep the logged-in session between launches; on
 * React Native that is AsyncStorage. This must be set before initialize().
 */
Parse.setAsyncStorage(AsyncStorage);
Parse.initialize(parseConfig.appId, parseConfig.javascriptKey);
(Parse as any).serverURL = parseConfig.serverURL;
(Parse as any).liveQueryServerURL = parseConfig.liveQueryURL;

export default Parse;

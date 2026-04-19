import { formatUser } from '@codegraphy/example-shared';
import type { UserName } from '@codegraphy/example-shared';
import { buildGreeting } from './utils';

const currentUser: UserName = formatUser('CodeGraphy');

console.log(buildGreeting(currentUser));
